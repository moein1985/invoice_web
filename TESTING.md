# 🧪 Testing Authentication

## Test Login API

### Using cURL:
```bash
# Login با admin
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

### Using PowerShell:
```powershell
# Login با admin
$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $body -ContentType "application/json"
$response

# Get Profile
$token = $response.token
$headers = @{
    Authorization = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3001/auth/me" -Method Get -Headers $headers
```

## Test Accounts

| Username | Password    | Role    |
|----------|-------------|---------|
| admin    | admin123    | admin   |
| manager  | manager123  | manager |
| user     | user123     | user    |

## Frontend URLs

- Homepage: http://localhost:3000
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard

## Backend URLs

- API Base: http://localhost:3001
- Login: POST http://localhost:3001/auth/login
- Get Profile: GET http://localhost:3001/auth/me
- Logout: POST http://localhost:3001/auth/logout
