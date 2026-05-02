$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Parent = Split-Path $Root -Parent
$CourseRoot = Get-ChildItem -LiteralPath $Parent -Directory | Where-Object { (Test-Path (Join-Path $_.FullName 'index.html')) -and (Test-Path (Join-Path $_.FullName 'firebase.json')) } | Select-Object -First 1 -ExpandProperty FullName
if (-not $CourseRoot) { throw 'Course site folder was not found next to QA_System. Expected index.html and firebase.json.' }
$Logs = Join-Path $Root 'logs'
New-Item -ItemType Directory -Force -Path $Logs | Out-Null
function Test-Node { if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js was not found in PATH.' } }
function Test-PortFree([int]$Port) { return -not (Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue) }
function Find-FreePort([int]$Preferred) { for ($p=$Preferred; $p -lt ($Preferred + 100); $p++) { if (Test-PortFree $p) { return $p } }; throw "No free port found from $Preferred" }
Test-Node
Set-Location $Root
if (-not (Test-Path (Join-Path $Root 'node_modules'))) { npm.cmd install }
$CoursePort = Find-FreePort 8080
$QaPort = Find-FreePort 9090
$TargetUrl = "http://localhost:$CoursePort"
$QaUrl = "http://localhost:$QaPort"
$env:TARGET_URL = $TargetUrl
$courseOut = Join-Path $Logs 'course-server.log'
$courseErr = Join-Path $Logs 'course-server.err.log'
$qaOut = Join-Path $Logs 'qa-dashboard.log'
$qaErr = Join-Path $Logs 'qa-dashboard.err.log'
$course = Start-Process -FilePath 'node.exe' -ArgumentList @('scripts/static-course-server.js','--port',"$CoursePort") -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $courseOut -RedirectStandardError $courseErr -PassThru
$env:PORT = "$QaPort"
$qa = Start-Process -FilePath 'node.exe' -ArgumentList 'server.js' -WorkingDirectory $Root -WindowStyle Hidden -RedirectStandardOutput $qaOut -RedirectStandardError $qaErr -PassThru
$runtime = [ordered]@{ startedAt=(Get-Date).ToString('o'); coursePort=$CoursePort; qaPort=$QaPort; targetUrl=$TargetUrl; qaUrl=$QaUrl; coursePid=$course.Id; qaPid=$qa.Id; logs=$Logs; courseRoot=$CourseRoot }
$runtime | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $Root '.qa-runtime.json') -Encoding UTF8
Write-Host "Course URL: $TargetUrl"
Write-Host "QA Dashboard: $QaUrl"
Write-Host "Logs: $Logs"
Start-Sleep -Seconds 2
Start-Process $QaUrl
