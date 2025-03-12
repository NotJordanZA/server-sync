@echo off
::UpdateTest1
powershell.exe -ExecutionPolicy Bypass -File "C:\Users\jorda\Documents\GitHub\server-sync\frontend\scripts\multithreadedsync.ps1" -sessionUrl "ftp://test:pass@update" -remotePath "reDir" -localPath "locDir" -logPath "logDir" -fileMask ">5Y|*.tmp" -connections 2
