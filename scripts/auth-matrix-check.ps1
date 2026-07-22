$ErrorActionPreference = 'Stop'

Set-Location "c:\Users\Accounts Manager\Downloads\aura-stay-erp-aeds-v2"

$envText = if (Test-Path .env) { Get-Content .env -Raw } else { '' }
function G([string]$n) {
  $m = [regex]::Match($envText, "(?m)^$n=(.*)$")
  if ($m.Success) { return $m.Groups[1].Value.Trim() }
  return $null
}

$url = G 'SUPABASE_URL'
if (-not $url) { $url = G 'VITE_SUPABASE_URL' }
$anon = G 'SUPABASE_ANON_KEY'
if (-not $anon) { $anon = G 'VITE_SUPABASE_ANON_KEY' }

$api = 'http://localhost:4000/api/reports'
$gw1 = 'http://localhost:8080/resort/reports'
$gw2 = 'http://localhost:8080/resort/api/reports'

function StatusOf($uri, $headers = $null) {
  try {
    if ($headers) {
      $r = Invoke-WebRequest -UseBasicParsing -Uri $uri -Method GET -Headers $headers
    } else {
      $r = Invoke-WebRequest -UseBasicParsing -Uri $uri -Method GET
    }
    return $r.StatusCode
  } catch {
    if ($_.Exception.Response) { return $_.Exception.Response.StatusCode.value__ }
    return 'ERR'
  }
}

"API_NO_TOKEN=$(StatusOf $api)"
"GW1_NO_TOKEN=$(StatusOf $gw1)"
"GW2_NO_TOKEN=$(StatusOf $gw2)"

$bad = @{ Authorization = 'Bearer invalid.token.value' }
"API_INVALID_TOKEN=$(StatusOf $api $bad)"
"GW1_INVALID_TOKEN=$(StatusOf $gw1 $bad)"
"GW2_INVALID_TOKEN=$(StatusOf $gw2 $bad)"

$body = @{ email = 'demo@aura-stay.local'; password = 'demo1234' } | ConvertTo-Json
$h = @{ apikey = $anon; Authorization = "Bearer $anon"; 'Content-Type' = 'application/json' }
$auth = Invoke-RestMethod -Method Post -Uri "$url/auth/v1/token?grant_type=password" -Headers $h -Body $body

if (-not $auth.access_token) {
  'VALID_TOKEN_MINT_FAILED'
  exit 0
}

$vh = @{ Authorization = "Bearer $($auth.access_token)" }
"API_VALID_TOKEN=$(StatusOf $api $vh)"
"GW1_VALID_TOKEN=$(StatusOf $gw1 $vh)"
"GW2_VALID_TOKEN=$(StatusOf $gw2 $vh)"
"AUTH_EMAIL=$($auth.user.email)"
"AUTH_USER_ID=$($auth.user.id)"
