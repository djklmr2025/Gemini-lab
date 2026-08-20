@echo off
title ARKAIOS - Gemini-Lab Omni Co-Agent Server
echo ========================================================
echo   Iniciando Co-Agente Gemini-Lab Omni (AETHYR Core)
echo ========================================================
echo.
cd /d C:\ARKAIOS\Gemini-lab-main
if not exist "node_modules\.bin\vite.cmd" (
    echo Instalando dependencias necesarias...
    call npm install
)
call npm run dev
pause
