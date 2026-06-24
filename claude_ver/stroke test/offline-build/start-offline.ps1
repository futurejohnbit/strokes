Set-Location -Path $PSScriptRoot
$env:PORT = $env:PORT -ne $null ? $env:PORT : "4173"
Start-Process "http://localhost:$env:PORT/"
node server.mjs
