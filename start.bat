@echo off
cd /d "%~dp0"
echo SHEDITHERS // starting local server on http://localhost:8737
start "" http://localhost:8737
python -m http.server 8737
