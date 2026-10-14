$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$node = (Get-Command node -ErrorAction Stop).Source
$ngrok = (Get-Command ngrok -ErrorAction Stop).Source
$secretDir = Join-Path $root '.local-secrets'
$passwordFile = Join-Path $secretDir 'public-access.txt'
New-Item -ItemType Directory -Force -Path $secretDir | Out-Null

if (-not (Test-Path -LiteralPath $passwordFile)) {
  $bytes = New-Object byte[] 24
  $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
  $rng.GetBytes($bytes)
  $rng.Dispose()
  $password = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+','-').Replace('/','_')
  [System.IO.File]::WriteAllText($passwordFile, $password, [System.Text.UTF8Encoding]::new($false))
}

function Test-LocalEndpoint([int]$port, [string]$path) {
  try { Invoke-WebRequest -Uri "http://127.0.0.1:$port$path" -TimeoutSec 2 -UseBasicParsing | Out-Null; return $true }
  catch { return $_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 401 }
}

if (-not (Test-LocalEndpoint 3000 '/api/settings')) {
  Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory $root -WindowStyle Hidden | Out-Null
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-LocalEndpoint 3000 '/api/settings') { $ready = $true; break }
  }
  if (-not $ready) { throw 'O servidor do AgenteHub não iniciou na porta 3000.' }
}

if (-not (Test-LocalEndpoint 3001 '/__agentehub_health')) {
  Start-Process -FilePath $node -ArgumentList 'public-proxy.js' -WorkingDirectory $root -WindowStyle Hidden | Out-Null
  $ready = $false
  for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try { Invoke-RestMethod -Uri 'http://127.0.0.1:3001/__agentehub_health' -TimeoutSec 2 | Out-Null; $ready = $true; break } catch { }
  }
  if (-not $ready) { throw 'A proteção de acesso externo não iniciou na porta 3001.' }
}

$tunnel = $null
try { $tunnel = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 2 } catch { }
if (-not ($tunnel.tunnels | Where-Object { $_.config.addr -match '3001' })) {
  Start-Process -FilePath $ngrok -ArgumentList @('http','3001') -WorkingDirectory $root -WindowStyle Hidden | Out-Null
}

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  try {
    $tunnel = Invoke-RestMethod -Uri 'http://127.0.0.1:4040/api/tunnels' -TimeoutSec 2
    $publicUrl = ($tunnel.tunnels | Where-Object { $_.config.addr -match '3001' -and $_.public_url.StartsWith('https://') } | Select-Object -First 1).public_url
    if ($publicUrl) { break }
  } catch { }
}

if (-not $publicUrl) { throw 'O túnel não iniciou. Confira se o ngrok está conectado à sua conta.' }
Write-Host "AgenteHub local conectado pelo túnel: $publicUrl"
Write-Host 'A senha privada de acesso está salva em .local-secrets/public-access.txt.'
Write-Host 'Deixe este computador ligado e conectado à internet para manter o WhatsApp ativo.'
