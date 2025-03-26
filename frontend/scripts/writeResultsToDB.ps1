[CmdletBinding()]
param (
    # The log file to be processed. If provided, log file mode is used.
    [string]$scheduleLogPath,
    
    # Direct input mode parameters (both must be provided for direct mode)
    [string]$profileName,
    [string]$result,
    
    # The API endpoint URL (mandatory)
    [Parameter(Mandatory = $true)]
    [string]$dbURL
)

if ($scheduleLogPath) {
    # Mode 1: Log file mode
    Write-Output "Processing log file: $scheduleLogPath"
    
    # Read all lines from the file
    $lines = Get-Content $scheduleLogPath
    
    # Find the last occurrence of "The results:"
    $lastResultMatch = $lines | Select-String -Pattern "The results:" | Select-Object -Last 1
    if (-not $lastResultMatch) {
        Write-Error "The file does not contain 'The results:'"
        exit 1
    }
    
    # Determine the index to start processing (immediately after "The results:")
    $startIndex = $lastResultMatch.LineNumber  
    if ($startIndex -ge $lines.Length) {
        Write-Error "No data found after the last 'The results:' line."
        exit 1
    }
    
    # Get the data lines after the last "The results:" line
    $dataLines = $lines[$startIndex..($lines.Length - 1)]
    
    # Process the data in groups of three: profile, email, status
    $results = @()
    for ($i = 0; $i -lt $dataLines.Count; $i += 7) {
        if ($i + 6 -lt $dataLines.Count) {
            $profileName   = $dataLines[$i].Trim()
            $email         = $dataLines[$i + 1].Trim()
            $filesSynced   = $dataLines[$i + 2].Trim()
            $filesSkipped  = $dataLines[$i + 3].Trim()
            $filesDeleted  = $dataLines[$i + 4].Trim()
            $totalFiles    = $dataLines[$i + 5].Trim()
            $status        = $dataLines[$i + 6].Trim()
    
            # Convert the status code to a message
            switch ($status) {
                "Done"  { $statusMessage = "Synced Successfully" }
                "Error" { $statusMessage = "Sync Failed" }
                default { $statusMessage = $status }
            }
    
            # Build a custom object for the result
            $results += [PSCustomObject]@{
                Profile       = $profileName
                Email         = $email
                FilesSynced   = $filesSynced
                FilesSkipped  = $filesSkipped
                FilesDeleted  = $filesDeleted
                TotalFiles    = $totalFiles
                StatusMessage = $statusMessage
            }
        }
    }
    
    # Post each entry to the API
    foreach ($entry in $results) {
        $payload = @{
            profileName   = $entry.Profile
            result        = $entry.StatusMessage
            filesSynced   = $entry.filesSynced
            filesSkipped  = $entry.filesSkipped
            filesDeleted  = $entry.filesDeleted
            totalFiles    = $entry.totalFiles
        } | ConvertTo-Json
        
        try {
            $response = Invoke-RestMethod -Uri $dbURL -Method Post -ContentType "application/json" -Body $payload
            Write-Output "Successfully posted for profile '$($entry.Profile)': $($response.message)"
        }
        catch {
            Write-Error "Failed to post for profile '$($entry.Profile)': $_"
        }
    }
}
elseif ($profileName -and $result) {
    # Mode 2: Direct input mode
    Write-Output "Using direct input mode for profile '$profileName'"
    
    $payload = @{
        profileName = $profileName
        result      = $result
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $dbURL -Method Post -ContentType "application/json" -Body $payload
        Write-Output "Successfully posted for profile '$profileName': $($response.message)"
    }
    catch {
        Write-Error "Failed to post for profile '$profileName': $_"
    }
}
else {
    Write-Error "Invalid parameters. Provide either a scheduleLogPath for log file processing or both profileName and result for direct submission."
    exit 1
}
