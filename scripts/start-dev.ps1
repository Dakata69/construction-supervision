# Start both backend (Django) and frontend (Vite) locally

$ErrorActionPreference = 'Continue'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

# Ensure PowerShell execution policy allows running this script, if needed:
# Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Bypass -Force

# Free dev ports
& "$PSScriptRoot/kill-port.ps1" -Port 8000
& "$PSScriptRoot/kill-port.ps1" -Port 5173

# Start backend (Django)
Start-Process -FilePath python -ArgumentList "backend\manage.py","runserver" -WorkingDirectory $repoRoot -WindowStyle Minimized
Start-Sleep -Seconds 2

# Start frontend (Vite) pinned to 5173 (vite.config strictPort=true)
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","Push-Location '$repoRoot/frontend'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 2

# Open browser
Start-Process "http://localhost:5173"

Pop-Location
