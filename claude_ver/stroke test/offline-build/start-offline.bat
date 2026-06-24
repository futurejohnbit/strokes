@echo off
cd /d %~dp0
set PORT=4173
start "" "http://localhost:%PORT%/"
node server.mjs
