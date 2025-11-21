# تست کامل Workflow

Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   تست سیستم Invoice - Approval Workflow  " -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3001"

# تابع helper برای request
function Invoke-API {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        return Invoke-RestMethod @params
    }
    catch {
        Write-Host "❌ خطا: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "   جزئیات: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        return $null
    }
}

# 1. Login با Employee
Write-Host "1️⃣  Login با Employee..." -ForegroundColor Yellow
$employee = Invoke-API -Endpoint "/auth/login" -Method POST -Body '{"username":"employee","password":"employee123"}'
if ($employee) {
    Write-Host "   ✅ $($employee.user.fullName) - محدودیت: 10M تومان" -ForegroundColor Green
    $empToken = $employee.access_token
}
else {
    Write-Host "   ❌ Login ناموفق!" -ForegroundColor Red
    exit
}

# 2. دریافت لیست مشتریان
Write-Host "`n2️⃣  دریافت لیست مشتریان..." -ForegroundColor Yellow
$customers = Invoke-API -Endpoint "/customers" -Headers @{Authorization="Bearer $empToken"}
if ($customers -and $customers.data.Count -gt 0) {
    $customerId = $customers.data[0].id
    Write-Host "   ✅ $($customers.meta.total) مشتری - انتخاب: $($customers.data[0].name)" -ForegroundColor Green
}
else {
    Write-Host "   ❌ مشتری یافت نشد!" -ForegroundColor Red
    exit
}

# 3. ساخت temp_proforma با مبلغ بالا (نیاز به تأیید)
Write-Host "`n3️⃣  ساخت temp_proforma (90M تومان - نیاز به تأیید)..." -ForegroundColor Yellow
$docData = @{
    documentType = "temp_proforma"
    customerId = $customerId
    issueDate = "2024-11-21"
    discountAmount = 0
    defaultProfitPercentage = 20
    requiresApproval = $true
    notes = "Test Approval Workflow"
    items = @(
        @{
            description = "Laptop Dell XPS 15"
            quantity = 2
            unitPrice = 45000000
            purchasePrice = 38000000
            profitPercentage = 18.42
            isManualPrice = $false
        }
    )
}
$docBody = $docData | ConvertTo-Json -Depth 10

$newDoc = Invoke-API -Endpoint "/documents" -Method POST -Headers @{Authorization="Bearer $empToken"} -Body $docBody
if ($newDoc) {
    Write-Host "   ✅ سند ساخته شد: $($newDoc.documentNumber)" -ForegroundColor Green
    Write-Host "      مبلغ نهایی: $([decimal]$newDoc.finalAmount / 1000000)M تومان" -ForegroundColor White
    Write-Host "      وضعیت: $($newDoc.approvalStatus)" -ForegroundColor $(if($newDoc.approvalStatus -eq 'pending'){'Yellow'}else{'White'})
    $docId = $newDoc.id
}
else {
    Write-Host "   ❌ ساخت سند ناموفق!" -ForegroundColor Red
    exit
}

# 4. Login با Supervisor
Write-Host "`n4️⃣  Login با Supervisor..." -ForegroundColor Yellow
$supBody = '{"username":"supervisor","password":"supervisor123"}'
$supervisor = Invoke-API -Endpoint "/auth/login" -Method POST -Body $supBody
if ($supervisor) {
    Write-Host "   ✅ $($supervisor.user.fullName) - محدودیت: 100M تومان" -ForegroundColor Green
    $supToken = $supervisor.access_token
}
else {
    Write-Host "   ❌ Login ناموفق!" -ForegroundColor Red
    exit
}

# 5. مشاهده اسناد منتظر تأیید
Write-Host "`n5️⃣  مشاهده اسناد منتظر تأیید..." -ForegroundColor Yellow
$pending = Invoke-API -Endpoint "/documents/approvals/pending" -Headers @{Authorization="Bearer $supToken"}
if ($pending -and $pending.data.Count -gt 0) {
    Write-Host "   ✅ $($pending.meta.total) سند منتظر تأیید" -ForegroundColor Green
    foreach ($doc in $pending.data) {
        Write-Host "      • $($doc.documentNumber) - $([decimal]$doc.finalAmount / 1000000)M تومان" -ForegroundColor White
    }
}
else {
    Write-Host "   ⚠️  هیچ سند منتظری نیست" -ForegroundColor Yellow
}

# 6. تأیید سند
Write-Host "`n6️⃣  تأیید سند توسط Supervisor..." -ForegroundColor Yellow
$approved = Invoke-API -Endpoint "/documents/$docId/approve" -Method POST -Headers @{Authorization="Bearer $supToken"}
if ($approved) {
    Write-Host "   ✅ سند تأیید شد!" -ForegroundColor Green
    Write-Host "      تأیید کننده: $($approved.approvedByName)" -ForegroundColor White
    Write-Host "      زمان تأیید: $($approved.approvedAt)" -ForegroundColor White
}
else {
    Write-Host "   ❌ تأیید ناموفق!" -ForegroundColor Red
    exit
}

# 7. تبدیل به proforma
Write-Host "`n7️⃣  تبدیل temp_proforma به proforma..." -ForegroundColor Yellow
$proforma = Invoke-API -Endpoint "/documents/$docId/convert" -Method POST -Headers @{Authorization="Bearer $empToken"}
if ($proforma) {
    Write-Host "   ✅ تبدیل موفق!" -ForegroundColor Green
    Write-Host "      سند جدید: $($proforma.documentNumber)" -ForegroundColor White
    Write-Host "      نوع: $($proforma.documentType)" -ForegroundColor White
    $proformaId = $proforma.id
}
else {
    Write-Host "   ❌ تبدیل ناموفق!" -ForegroundColor Red
    exit
}

# 8. تبدیل به invoice
Write-Host "`n8️⃣  تبدیل proforma به invoice..." -ForegroundColor Yellow
$invoice = Invoke-API -Endpoint "/documents/$proformaId/convert" -Method POST -Headers @{Authorization="Bearer $empToken"}
if ($invoice) {
    Write-Host "   ✅ فاکتور نهایی ساخته شد!" -ForegroundColor Green
    Write-Host "      شماره فاکتور: $($invoice.documentNumber)" -ForegroundColor White
    Write-Host "      نوع: $($invoice.documentType)" -ForegroundColor White
    $invoiceId = $invoice.id
}
else {
    Write-Host "   ❌ تبدیل ناموفق!" -ForegroundColor Red
    exit
}

# 9. مشاهده زنجیره تبدیل
Write-Host "`n9️⃣  مشاهده زنجیره تبدیل کامل..." -ForegroundColor Yellow
$chain = Invoke-API -Endpoint "/documents/$invoiceId/conversion-chain" -Headers @{Authorization="Bearer $empToken"}
if ($chain) {
    Write-Host "   ✅ زنجیره تبدیل:" -ForegroundColor Green
    for ($i = 0; $i -lt $chain.Count; $i++) {
        $arrow = if ($i -lt $chain.Count - 1) { "  ↓" } else { "" }
        Write-Host "      $($i+1). $($chain[$i].documentNumber) ($($chain[$i].documentType))$arrow" -ForegroundColor White
    }
}

# 10. تاریخچه تأییدات
Write-Host "`n🔟 تاریخچه تأییدات Supervisor..." -ForegroundColor Yellow
$history = Invoke-API -Endpoint "/documents/approvals/history" -Headers @{Authorization="Bearer $supToken"}
if ($history -and $history.data.Count -gt 0) {
    Write-Host "   ✅ $($history.meta.total) سند تأیید/رد شده" -ForegroundColor Green
    foreach ($doc in $history.data) {
        $statusText = if ($doc.approvalStatus -eq 'approved') { "Approved" } else { "Rejected" }
        $color = if ($doc.approvalStatus -eq 'approved') { 'Green' } else { 'Red' }
        Write-Host "      - $($doc.documentNumber) - $statusText" -ForegroundColor $color
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "        🎉 تست با موفقیت کامل شد!        " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 خلاصه:" -ForegroundColor White
Write-Host "   • سند temp_proforma ساخته شد" -ForegroundColor White
Write-Host "   • درخواست تأیید ارسال شد" -ForegroundColor White
Write-Host "   • Supervisor سند را تأیید کرد" -ForegroundColor White
Write-Host "   • تبدیل به proforma انجام شد" -ForegroundColor White
Write-Host "   • تبدیل به invoice (فاکتور نهایی) انجام شد" -ForegroundColor White
Write-Host "   • زنجیره تبدیل کامل ثبت شد" -ForegroundColor White
Write-Host ""
