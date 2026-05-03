@echo off
cd /d "%~dp0"
node check.js >> results\watcher.log 2>&1
