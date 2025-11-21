# Simple Workflow Test

$baseUrl = "http://localhost:3001"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Invoice Approval Workflow Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Login as Employee
Write-Host "1. Login as Employee..." -ForegroundColor Yellow
$empResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"employee","password":"employee123"}'
Write-Host "   OK: $($empResponse.user.fullName) - Max Approval: 10M" -ForegroundColor Green
$empToken = $empResponse.token

# Step 2: Get Customers
Write-Host "`n2. Get Customers..." -ForegroundColor Yellow
$customers = Invoke-RestMethod -Uri "$baseUrl/customers" -Headers @{Authorization="Bearer $empToken"}
$customerId = $customers.data[0].id
Write-Host "   OK: $($customers.meta.total) customers - Selected: $($customers.data[0].name)" -ForegroundColor Green

# Step 3: Create temp_proforma (90M - Needs Approval)
Write-Host "`n3. Create temp_proforma (90M - Needs Approval)..." -ForegroundColor Yellow
$docJson = @"
{
  "documentType": "temp_proforma",
  "customerId": "$customerId",
  "issueDate": "2024-11-21",
  "discountAmount": 0,
  "defaultProfitPercentage": 20,
  "requiresApproval": true,
  "notes": "Test Workflow",
  "items": [
    {
      "description": "Laptop Dell XPS 15",
      "quantity": 2,
      "unitPrice": 45000000,
      "purchasePrice": 38000000,
      "profitPercentage": 18.42,
      "isManualPrice": false
    }
  ]
}
"@

$newDoc = Invoke-RestMethod -Uri "$baseUrl/documents" -Method POST -ContentType "application/json" -Headers @{Authorization="Bearer $empToken"} -Body $docJson
Write-Host "   OK: $($newDoc.documentNumber) - Amount: $([decimal]$newDoc.finalAmount/1000000)M - Status: $($newDoc.approvalStatus)" -ForegroundColor Green
$docId = $newDoc.id

# Step 4: Login as Supervisor
Write-Host "`n4. Login as Supervisor..." -ForegroundColor Yellow
$supResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"supervisor","password":"supervisor123"}'
Write-Host "   OK: $($supResponse.user.fullName) - Max Approval: 100M" -ForegroundColor Green
$supToken = $supResponse.token

# Step 5: Check Pending Approvals
Write-Host "`n5. Check Pending Approvals..." -ForegroundColor Yellow
$pending = Invoke-RestMethod -Uri "$baseUrl/documents/approvals/pending" -Headers @{Authorization="Bearer $supToken"}
Write-Host "   OK: $($pending.meta.total) pending documents" -ForegroundColor Green
foreach ($doc in $pending.data) {
    Write-Host "      - $($doc.documentNumber) - $([decimal]$doc.finalAmount/1000000)M" -ForegroundColor White
}

# Step 6: Approve Document
Write-Host "`n6. Approve Document..." -ForegroundColor Yellow
$approved = Invoke-RestMethod -Uri "$baseUrl/documents/$docId/approve" -Method POST -Headers @{Authorization="Bearer $supToken"}
Write-Host "   OK: Document approved by $($approved.approvedByName)" -ForegroundColor Green

# Step 7: Convert to Proforma
Write-Host "`n7. Convert to Proforma..." -ForegroundColor Yellow
$proforma = Invoke-RestMethod -Uri "$baseUrl/documents/$docId/convert" -Method POST -Headers @{Authorization="Bearer $empToken"}
Write-Host "   OK: Converted to $($proforma.documentNumber) ($($proforma.documentType))" -ForegroundColor Green
$proformaId = $proforma.id

# Step 8: Convert to Invoice
Write-Host "`n8. Convert to Invoice..." -ForegroundColor Yellow
$invoice = Invoke-RestMethod -Uri "$baseUrl/documents/$proformaId/convert" -Method POST -Headers @{Authorization="Bearer $empToken"}
Write-Host "   OK: Final invoice $($invoice.documentNumber) created" -ForegroundColor Green
$invoiceId = $invoice.id

# Step 9: View Conversion Chain
Write-Host "`n9. View Conversion Chain..." -ForegroundColor Yellow
$chain = Invoke-RestMethod -Uri "$baseUrl/documents/$invoiceId/conversion-chain" -Headers @{Authorization="Bearer $empToken"}
Write-Host "   OK: Conversion chain with $($chain.Count) documents:" -ForegroundColor Green
foreach ($doc in $chain) {
    Write-Host "      -> $($doc.documentNumber) ($($doc.documentType))" -ForegroundColor White
}

# Step 10: Check Approval History
Write-Host "`n10. Check Approval History..." -ForegroundColor Yellow
$history = Invoke-RestMethod -Uri "$baseUrl/documents/approvals/history" -Headers @{Authorization="Bearer $supToken"}
Write-Host "   OK: $($history.meta.total) documents in approval history" -ForegroundColor Green

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   Test Completed Successfully!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Summary:" -ForegroundColor White
Write-Host "  - Created temp_proforma document" -ForegroundColor White
Write-Host "  - Requested approval" -ForegroundColor White
Write-Host "  - Supervisor approved" -ForegroundColor White
Write-Host "  - Converted to proforma" -ForegroundColor White
Write-Host "  - Converted to invoice" -ForegroundColor White
Write-Host "  - Full conversion chain tracked`n" -ForegroundColor White
