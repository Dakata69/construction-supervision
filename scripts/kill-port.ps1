param(
  [Parameter(Mandatory=$true)]
  [int]$Port
)

Write-Host "Checking for processes on port $Port..."
try {
  $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
} catch {
  Write-Host "Get-NetTCPConnection not available; trying netstat parsing..."
  $netstat = netstat -ano | Select-String ":$Port\s"
  if (-not $netstat) { Write-Host "No process found on port $Port"; exit 0 }
  $pids = @()
  foreach ($line in $netstat) {
    $parts = ($line -split "\s+") | Where-Object { $_ -ne '' }
    if ($parts.Length -ge 5) { $pids += $parts[-1] }
  }
  $pids = $pids | Where-Object { $_ -as [int] -and ([int]$_) -gt 0 } | ForEach-Object { [int]$_ } | Sort-Object -Unique
  if (-not $pids) { Write-Host "No process found on port $Port"; exit 0 }
  foreach ($procId in $pids) {
    try { Stop-Process -Id $procId -Force -ErrorAction Stop; Write-Host "Killed PID $procId on port $Port" }
    catch { Write-Host "Failed to kill PID ${procId}: $($_.Exception.Message)" }
  }
  exit 0
}

if (-not $connections) {
  Write-Host "No process found on port $Port"
  exit 0
}

$pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique | Where-Object { $_ -gt 0 }
foreach ($procId in $pids) {
  try { Stop-Process -Id $procId -Force -ErrorAction Stop; Write-Host "Killed PID $procId on port $Port" }
  catch { Write-Host "Failed to kill PID ${procId}: $($_.Exception.Message)" }
}
