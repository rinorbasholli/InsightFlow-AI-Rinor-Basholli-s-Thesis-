# One-shot: install deps and start InsightFlow on Windows.
# Double-click run-lab.bat, or in PowerShell:  powershell -ExecutionPolicy Bypass -File .\run-lab.ps1
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot

function Need($name, $url) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Host "MISSING: $name"
    Write-Host "Install Node 22 from https://nodejs.org and Python 3.10+ from https://www.python.org (tick Add to PATH)."
    Write-Host "Then close this window and run the script again."
    Write-Host $url
    exit 1
  }
}

Need "node" "https://nodejs.org"
Need "npm" "https://nodejs.org"

$py = $null
foreach ($c in @("py", "python", "python3")) {
  if (Get-Command $c -ErrorAction SilentlyContinue) { $py = $c; break }
}
if (-not $py) {
  Write-Host "MISSING: Python"
  Write-Host "Install Python 3.10+ from https://www.python.org and tick Add python.exe to PATH."
  exit 1
}

$nodeMajor = [int](node -p "process.versions.node.split('.')[0]")
if ($nodeMajor -lt 18) {
  Write-Host "Node $(node -v) is too old. Install Node 22 from https://nodejs.org"
  exit 1
}

if (-not (Test-Path "package.json") -or -not (Test-Path "eval\adversarial\service.py")) {
  Write-Host "This script must sit in the InsightFlow project folder (next to package.json)."
  exit 1
}

if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host ""
  Write-Host "Created .env.local from the example."
  Write-Host "Login user/password are the LAB_BASIC_USER and LAB_BASIC_PASS lines in that file."
  Write-Host "You can change them in Notepad. Gemini key is optional."
  Write-Host ""
}

Get-Content ".env.local" | ForEach-Object {
  $line = $_.Trim()
  if ($line -eq "" -or $line.StartsWith("#")) { return }
  $i = $line.IndexOf("=")
  if ($i -lt 1) { return }
  $k = $line.Substring(0, $i).Trim()
  $v = $line.Substring($i + 1).Trim().Trim('"').Trim("'")
  Set-Item -Path "Env:$k" -Value $v
}

if (-not $env:LAB_BASIC_USER -or -not $env:LAB_BASIC_PASS) {
  Write-Host ".env.local must set LAB_BASIC_USER and LAB_BASIC_PASS."
  exit 1
}

Write-Host "==> npm install (first time can take a few minutes)"
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path ".venv\Scripts\python.exe")) {
  Write-Host "==> creating Python virtualenv .venv"
  if ($py -eq "py") { py -3 -m venv .venv } else { & $py -m venv .venv }
}

Write-Host "==> pip install (PyTorch is big; first time can take 5-15 minutes)"
& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -r eval\requirements.txt

New-Item -ItemType Directory -Force -Path ".run" | Out-Null
Write-Host "==> starting attack service on port 8001"
$eval = Start-Process -FilePath (Join-Path $PSScriptRoot ".venv\Scripts\python.exe") `
  -ArgumentList "service.py" `
  -WorkingDirectory (Join-Path $PSScriptRoot "eval\adversarial") `
  -RedirectStandardOutput (Join-Path $PSScriptRoot ".run\eval.log") `
  -RedirectStandardError (Join-Path $PSScriptRoot ".run\eval.err.log") `
  -PassThru -WindowStyle Hidden
$eval.Id | Set-Content ".run\eval.pid"

function Stop-Eval {
  if ($eval -and -not $eval.HasExited) {
    Stop-Process -Id $eval.Id -Force -ErrorAction SilentlyContinue
  }
}

try {
  Write-Host "==> waiting for http://127.0.0.1:8001/health"
  $ok = $false
  for ($i = 0; $i -lt 60; $i++) {
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:8001/health" -UseBasicParsing -TimeoutSec 2
      if ($r.StatusCode -eq 200) { $ok = $true; break }
    } catch { }
    Start-Sleep -Seconds 1
  }
  if (-not $ok) {
    Write-Host "Attack service did not start. Last log lines:"
    if (Test-Path ".run\eval.log") { Get-Content ".run\eval.log" -Tail 40 }
    if (Test-Path ".run\eval.err.log") { Get-Content ".run\eval.err.log" -Tail 40 }
    exit 1
  }

  Write-Host ""
  Write-Host "Open  http://localhost:3000"
  Write-Host "Sign in with LAB_BASIC_USER / LAB_BASIC_PASS from the file .env.local in this folder."
  Write-Host "Leave this window open. Ctrl+C stops the lab."
  Write-Host "First click of Simulate can be slow (downloads CIFAR-10 once)."
  Write-Host ""

  npm run dev
} finally {
  Stop-Eval
}
