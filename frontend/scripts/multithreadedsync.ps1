param (
    [Parameter(Mandatory=$true)] [string]$profileName,
    [Parameter(Mandatory=$true)] [string]$sessionUrl,
    [Parameter(Mandatory=$true)] [string]$remotePath,
    [Parameter(Mandatory=$true)] [string]$localPath,
    [Parameter(Mandatory=$true)] [string]$logPath,
    [Parameter(Mandatory=$true)] [string]$internalLogPath,
    [Parameter(Mandatory=$true)] [string]$scheduleLogPath,
    [Parameter(Mandatory=$true)] [string]$fileMask,
    [Parameter(Mandatory=$true)] [int]$connections,
    [Parameter(Mandatory=$true)] [string]$email
)

function Write-Log {
    param (
        [string]$message
    )
    if($scheduleLogPath -ne " "){
        Add-Content -Path $scheduleLogPath -Value "$message"
    }
}

function Write-Stats {
    param (
        [int]$synced,
        [int]$skipped,
        [int]$deleted,
        [int]$total
    )
    Write-Log $synced
    Write-Log $skipped
    Write-Log $deleted
    Write-Log $total
}

function Get-SkippedFiles {
    param (
        [System.Object]$session,
        [string]$path
    )
    return $session.EnumerateRemoteFiles($path, "*.*", [WinSCP.EnumerationOptions]::AllDirectories).count
}

Start-Transcript -Path $internalLogPath -Append

try {
    Write-Log "$profileName"
    Write-Log "$email"
    $assemblyFilePath = Join-Path $PSScriptRoot "..\winscp\WinSCPnet.dll"
    Add-Type -Path $assemblyFilePath
 
    $sessionOptions = New-Object WinSCP.SessionOptions
    $sessionOptions.ParseUrl($sessionUrl)
 
    $started = Get-Date

    try {
        Write-Host "Connecting..."
        $session = New-Object WinSCP.Session
        if($logPath -ne " "){
            $session.SessionLogPath = $logPath
        }
        $sessionOptions.AddRawSettings("PreserveTimeDirs", "1")
        $sessionOptions.Timeout = New-TimeSpan -Seconds 30
        $session.Open($sessionOptions)

        $transferOptions = New-Object WinSCP.TransferOptions -Property @{
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

        Write-Host "Differences : $($differences)"

        if ($differences.Count -eq 0) {
            Write-Host "No changes found."
            $finalTotal = 0
            $files =  $session.EnumerateRemoteFiles($remotePath, "*.*", [WinSCP.EnumerationOptions]::AllDirectories)
            foreach ($file in $files){
                $finalTotal++
            }
            Write-Stats -synced 0 -skipped $finalTotal -deleted 0 -total $finalTotal
            Write-Host "Done"
            Write-Host "Finished: $(Get-Date)"
            Write-Log "Done"   
        }
        else {
            if ($differences.Count -lt $connections) {
                $connections = $differences.Count
            }
            $differenceEnumerator = $differences.GetEnumerator()
     
            # Start thread jobs. Each job will maintain its own counters.
            for ($i = 1; $i -le $connections; $i++) {
                Start-ThreadJob -Name "Connection $i" -ArgumentList $i {
                    param ($no)
     
                    # Initialize local counters
                    $localSynced  = 0
                    $localSkipped = 0
                    $localDeleted = 0
                    $localTotal   = 0

                    try {
                        Write-Host "Starting connection $no..."
                        $syncSession = New-Object WinSCP.Session
                        $syncSession.Open($using:sessionOptions)
     
                        while ($true) {
                            # Lock access to the enumerator
                            [System.Threading.Monitor]::Enter($using:differenceEnumerator)
                            try {
                                if (-not ($using:differenceEnumerator).MoveNext()) {
                                    break
                                }
                                $difference = ($using:differenceEnumerator).Current
                                $localTotal++
                            }
                            finally {
                                [System.Threading.Monitor]::Exit($using:differenceEnumerator)
                            }
     
                            Write-Host "$difference in connection $no..."
                            $difference.Resolve($syncSession) | Out-Null
                            Write-Host "difference operation: $($difference.Action)" 
                            switch ($difference.Action) {
                                "UploadNew" { $localSynced++ }
                                "UploadUpdate" { $localSynced++ }
                                "DeleteLocal" { $localDeleted++ }
                                "DeleteRemote" { $localDeleted++ }
                                "SkipLocal"   { $localSkipped++ }
                                default  { $localSynced++ }
                            }
                        }
                        Write-Host "Connection $no done"
                    }
                    finally {
                        $syncSession.Dispose()
                    }
     
                    # Output the local counters as a custom object.
                    [PSCustomObject]@{
                        Synced  = $localSynced
                        Skipped = $localSkipped
                        Deleted = $localDeleted
                        Total   = $localTotal
                    }
                } | Out-Null
            }
     
            Write-Host "Waiting for connections to complete..."
            $jobResults = Get-Job | Receive-Job -Wait -ErrorAction Stop
     
            # Aggregate results from all jobs.
            $finalTotal = 0
            $files =  $session.EnumerateRemoteFiles($remotePath, "*.*", [WinSCP.EnumerationOptions]::AllDirectories)
            foreach ($file in $files){
                $finalTotal++
            }
            Write-Host "Final Count $finalTotal"
            $finalSynced  = ($jobResults | Measure-Object -Property Synced  -Sum).Sum
            $finalDeleted = ($jobResults | Measure-Object -Property Deleted -Sum).Sum
            $finalSkipped = $finalTotal - ($finalSynced + $finalDeleted)
            
     
            # Log the aggregated stats BEFORE writing the final status.
            Write-Stats -synced $finalSynced -skipped $finalSkipped -deleted $finalDeleted -total $finalTotal
            Write-Host "Done"
            Write-Host "Finished: $(Get-Date)"
            Write-Log "Done"
        }
 
        $ended = Get-Date
        Write-Host "Took $(New-TimeSpan -Start $started -End $ended)"
        Write-Host "Synchronized $($differences.Count) differences"
    }
    finally {
        $session.Dispose()
    }
 
    exit 0
}
catch
{
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Finished: $(Get-Date)"
    Write-Stats -synced 0 -skipped 0 -deleted 0 -total 0
    Write-Log "Error"
    exit 1
}

Stop-Transcript
