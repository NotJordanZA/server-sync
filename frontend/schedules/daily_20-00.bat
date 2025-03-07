@echo off
::8new
powershell.exe -ExecutionPolicy Bypass -File "C:\Users\jorda\Documents\GitHub\server-sync\frontend\util\scripts\multithreadedsync.ps1" -sessionUrl ftp://a:a@a -remotePath "a" -localPath "a" -logPath "1" -connections 1
