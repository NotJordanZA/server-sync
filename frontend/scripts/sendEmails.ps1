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

# Read all lines from the file
$lines = Get-Content $scheduleLogPath

# Find the last occurrence of "The results:"
$lastResultMatch = $lines | Select-String -Pattern "The results:" | Select-Object -Last 1

if (-not $lastResultMatch) {
    Write-Error "The file does not contain 'The results:'"
    exit 1
}

# Determine the index to start processing (immediately after "The results:")
$startIndex = $lastResultMatch.LineNumber  # (LineNumber is 1-based)
if ($startIndex -ge $lines.Length) {
    Write-Error "No data found after the last 'The results:' line."
    exit 1
}

# Get the data lines after the last "The results:" line
$dataLines = $lines[$startIndex..($lines.Length - 1)]

# Process the data in groups of three: profile, email, status
$results = @()
for ($i = 0; $i -lt $dataLines.Count; $i += 3) {
    if ($i + 2 -lt $dataLines.Count) {
        $profileName = $dataLines[$i].Trim()
        $email   = $dataLines[$i + 1].Trim()
        $status  = $dataLines[$i + 2].Trim()

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
    $toEmail = $group.Name
    $body = "Results:`n"
    foreach ($entry in $group.Group) {
        $body += "$($entry.Profile) - $($entry.StatusMessage)`n"
    }
    
    # Parameters for the Mailgun API request
    $bodyParams = @{
        from    = $MailgunFromAddress
        to      = $toEmail
        subject = $EmailSubject
        text    = $body
    }
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $bodyParams
        Write-Output "Email sent to $toEmail successfully."
    }
    catch {
        Write-Error "Failed to send email to $toEmail. Error: $_"
    }
}

