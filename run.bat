@echo off
REM Run the development environment setup script via PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0run.ps1" %*
