param (
    [Parameter(Mandatory=$true)] [string]$sessionUrl,
    [Parameter(Mandatory=$true)] [string]$remotePath,
    [Parameter(Mandatory=$true)] [string]$localPath,
    [Parameter(Mandatory=$true)] [string]$logPath,
    [Parameter(Mandatory=$true)] [string]$fileMask,
    [Parameter(Mandatory=$true)] [int]$connections
)
 
try
{
    # $assemblyFilePath = "C:\Program Files (x86)\WinSCP\netstandard2.0\WinSCPnet.dll"
    $assemblyFilePath = "..\winscp\WinSCPnet.dll"
    # Load WinSCP .NET assembly
    Add-Type -Path $assemblyFilePath
 
    # Setup session options
    $sessionOptions = New-Object WinSCP.SessionOptions
    $sessionOptions.ParseUrl($sessionUrl)
 
    $started = Get-Date
    #$dateForLog = Get-Date -Format "MM-dd-yyyy-HH:mm"
    #$logOutput = $logPath + $dateForLog + ".log"
    #New-Item $logOutput -type file
    # Plain variables cannot be modified in job threads
    $stats = @{
        count = 0
    }
 
    try
    {
        # Connect
        Write-Host "Connecting..."
        $session = New-Object WinSCP.Session
        $session.SessionLogPath = $logPath
        $sessionOptions.AddRawSettings("PreserveTimeDirs", "1")
        $session.Open($sessionOptions)

        $transferOptions = New-Object WinSCP.TransferOptions -Property @{
            # FileMask = ">5Y|*.tmp"
            FileMask = $fileMask
            PreserveTimestamp = $true
        }
        
        Write-Host "Comparing directories..."

        $differences = $session.CompareDirectories(
            [WinSCP.SynchronizationMode]::Remote, 
            $localPath, 
            $remotePath, 
            $true,  
            $transferOptions  
        )
        if ($differences.Count -eq 0)
        {
            Write-Host "No changes found."   
        }
        else
        {
            if ($differences.Count -lt $connections)
            {
                $connections = $differences.Count;
            }
            $differenceEnumerator = $differences.GetEnumerator()
     
            for ($i = 1; $i -le $connections; $i++)
            {
                Start-ThreadJob -Name "Connection $i" -ArgumentList $i {
                    param ($no)
     
                    try
                    {
                        Write-Host "Starting connection $no..."
     
                        $syncSession = New-Object WinSCP.Session
                        $syncSession.Open($using:sessionOptions)
     
                        while ($True)
                        {
                            [System.Threading.Monitor]::Enter($using:differenceEnumerator)
                            try
                            {
                                if (!($using:differenceEnumerator).MoveNext())
                                {
                                    break
                                }
     
                                $difference = ($using:differenceEnumerator).Current
                                ($using:stats).count++
                            }
                            finally
                            {
                                [System.Threading.Monitor]::Exit($using:differenceEnumerator)
                            }
 
                            Write-Host "$difference in $no..."
                            $difference.Resolve($syncSession) | Out-Null
                        }
     
                        Write-Host "Connection $no done"
                    }
                    finally
                    {
                        $syncSession.Dispose()
                    }
                } | Out-Null
            }
     
            Write-Host "Waiting for connections to complete..."
            Get-Job | Receive-Job -Wait -ErrorAction Stop
     
            Write-Host "Done"
        }
 
        $ended = Get-Date
        Write-Host "Took $(New-TimeSpan -Start $started -End $ended)"
        Write-Host "Synchronized $($stats.count) differences"
    }
    finally
    {
        # Disconnect, clean up
        $session.Dispose()
    }
 
    exit 0
}
catch
{
    Write-Host "Error: $($_.Exception.Message)"
    exit 1
}