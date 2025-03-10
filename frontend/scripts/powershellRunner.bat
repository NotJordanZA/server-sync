@echo off
::1
 powershell.exe -ExecutionPolicy Bypass -File "C:\Users\jorda\Documents\GitHub\server-sync\frontend\util\scripts\multithreadedsync.ps1" -sessionUrl "ftp://kjh:kjh@kjhk" -remotePath "kjh" -localPath "kjh" -logPath "kjh" -connections 1
::2
 powershell.exe -ExecutionPolicy Bypass -File "C:\Users\jorda\Documents\GitHub\server-sync\frontend\util\scripts\multithreadedsync.ps1" -sessionUrl "ftp://kjh:kjh@kjhk" -remotePath "kjh" -localPath "kjh" -logPath "kjh" -connections 1
::3
 powershell.exe -ExecutionPolicy Bypass -File "C:\Users\jorda\Documents\GitHub\server-sync\frontend\util\scripts\multithreadedsync.ps1" -sessionUrl "ftp://kjh:kjh@kjhk" -remotePath "kjh" -localPath "kjh" -logPath "kjh" -connections 1
::UpdateTest1
 powershell.exe -ExecutionPolicy Bypass -File "C:\Users\jorda\Documents\GitHub\server-sync\frontend\util\scripts\multithreadedsync.ps1" -sessionUrl "ftp://test:pass@update" -remotePath "reDir" -localPath "locDir" -logPath "logDir" -connections 2
