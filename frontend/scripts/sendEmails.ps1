[CmdletBinding()]
param (
    # The log file to be processed
    [Parameter(Mandatory = $true)]
    [string]$scheduleLogPath,
    
    # Mailgun API key
    [Parameter(Mandatory = $true)]
    [string]$MailgunApiKey,
    
    # Mailgun domain (e.g. "yourdomain.com")
    [Parameter(Mandatory = $true)]
    [string]$MailgunDomain,
    
    # The sender address (e.g. "Sender Name <mailgun@yourdomain.com>")
    [Parameter(Mandatory = $true)]
    [string]$MailgunFromAddress,
    
    # Subject for the emails (default provided)
    [Parameter(Mandatory = $false)]
    [string]$EmailSubject = "Sync Results"
)

$PassedInSubject = $EmailSubject

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

# Process the data in groups of seven:
# 0: Profile name
# 1: Email
# 2: Files Synchronized
# 3: Files Skipped
# 4: Files Deleted
# 5: Total Files
# 6: Status
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

        # Build a custom object for the result including the extra file stats
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

# Group the results by email address
$groupedResults = $results | Group-Object -Property Email

# Mailgun API endpoint
$uri = "https://api.mailgun.net/v3/$MailgunDomain/messages"

# Prepare the Basic Auth header using Mailgun's API key
$authInfo = "api:$MailgunApiKey"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($authInfo)
$base64AuthInfo = [Convert]::ToBase64String($bytes)
$headers = @{
    Authorization = "Basic $base64AuthInfo"
}

# For each email group, build the email body and send the email using Mailgun
foreach ($group in $groupedResults) {
    if($group.Name -ne "undefined"){
        $toEmail = $group.Name
        $totalCount = 0
        $successCount = 0
        $profileArray = @()

        foreach ($entry in $group.Group) {
            if($entry.StatusMessage -eq "Synced Successfully"){
                $successCount += 1
            }
            $statusClass = $entry.StatusMessage -eq "Synced Successfully" ? "success" : "error"
            $profileArray += @{
                profile       = $entry.Profile
                statusClass   = $statusClass
                statusMessage = $entry.StatusMessage
                filesSynced   = $entry.FilesSynced
                filesSkipped  = $entry.FilesSkipped
                filesDeleted  = $entry.FilesDeleted
                totalFiles    = $entry.TotalFiles
            }
            $totalCount += 1
        }

        $mailgunVariables = @{
            profiles = $profileArray
        } | ConvertTo-Json -Depth 3 -Compress 

        if($successCount -eq $totalCount){
            $EmailSubject = "$PassedInSubject - All Syncs Successfull"
        } else {
            $failedSyncs = $totalCount - $successCount
            if($failedSyncs -eq 1){
                $EmailSubject = "$PassedInSubject - $failedSyncs Sync Failed"
            } else {
                $EmailSubject = "$PassedInSubject - $failedSyncs Syncs Failed"
            }
        }
        
        # Parameters for the Mailgun API request
        $bodyParams = @{
            from         = $MailgunFromAddress
            to           = $toEmail
            subject      = $EmailSubject
            template     = 'server sync'
            "t:variables" = $mailgunVariables
        }
        
        try {
            $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $bodyParams
            Write-Output "Email sent to $toEmail successfully."
        }
        catch {
            Write-Error "Failed to send email to $toEmail. Error: $_"
        }
    }
}
