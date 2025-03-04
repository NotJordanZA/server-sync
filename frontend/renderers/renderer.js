document.getElementById("syncBtn").addEventListener("click", () => {
    const host = document.getElementById("host").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const localDir = document.getElementById("localDir").value;
    const remoteDir = document.getElementById("remoteDir").value;
    const logDir = document.getElementById("logDir").value;
    const noConnections = document.getElementById("noConnections").value;

    const sessionUrl = `-sessionUrl ftp://${username}:${password}@${host}`;
    const remotePath = `-remotePath "${remoteDir}"`;
    const localPath = `-localPath "${localDir}"`;
    const logPath = `-logPath "${logDir}"`;
    const connections = `-connections ${noConnections}`;
    const psCommand = `${sessionUrl} ${remotePath} ${localPath} ${logPath} ${connections}`;

    // Use electronAPI instead of ipcRenderer directly
    window.electronAPI.runPowerShell(psCommand);
});

// Listen for PowerShell output
window.electronAPI.onPowerShellOutput((data) => {
    document.getElementById("output").innerText = data;
});

document.getElementById("newProfileBtn").addEventListener("click", () => {
    window.electronAPI.openNewProfile();
});
  