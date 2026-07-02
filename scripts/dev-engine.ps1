# Adds the user-level PATH (where winget installs uv) before starting the engine.
$env:PATH = [System.Environment]::GetEnvironmentVariable("PATH","User") + ";" + $env:PATH
Set-Location "$PSScriptRoot\..\engine"
uv run uvicorn engine.main:app --reload --port 8000
