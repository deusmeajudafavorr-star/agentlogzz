@echo off
chcp 65001 >nul
title AgenteHub
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e rode este arquivo de novo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias ^(so na primeira vez, pode levar alguns minutos^)...
  call npm install --no-audit --no-fund
  if errorlevel 1 (
    echo Falha na instalacao. Verifique sua internet e o Git ^(https://git-scm.com^), exigido por uma dependencia do WhatsApp.
    pause
    exit /b 1
  )
)

start "" http://localhost:3000
node server.js
pause
