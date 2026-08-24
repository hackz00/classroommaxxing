@echo off
title classroommaxxing link maker
cd /d "%~dp0"

set /p NAME=package name (e.g. classroommaxxing-v6): 
if "%NAME%"=="" set NAME=classroommaxxing-v6

echo.
node "%~dp0..\tools\make-links.mjs" %NAME%
echo.
echo done. links saved to final\dist\links-%NAME%.txt
pause
