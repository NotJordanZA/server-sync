param (
    [Parameter(Mandatory=$true)] [string]$scheduleLogPath
)

function Write-Log {
    if($scheduleLogPath -ne ""){
        Add-Content -Path $scheduleLogPath -Value "$(Get-Date)"
        Add-Content -Path $scheduleLogPath -Value "The results:"
    }
}

Write-Log