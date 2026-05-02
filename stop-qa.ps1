$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Runtime = Join-Path $Root '.qa-runtime.json'
if (-not (Test-Path $Runtime)) {
  Write-Host 'No .qa-runtime.json found. Nothing to stop.'
  exit 0
}
$r = Get-Content -LiteralPath $Runtime -Raw | ConvertFrom-Json
foreach ($procId in @($r.coursePid, $r.qaPid)) {
  if ($procId -and (Get-Process -Id $procId -ErrorAction SilentlyContinue)) {
    Stop-Process -Id $procId -Force
    Write-Host "Stopped PID $procId"
  }
}
Remove-Item -LiteralPath $Runtime -Force -ErrorAction SilentlyContinue
Write-Host 'QA environment stopped.'
