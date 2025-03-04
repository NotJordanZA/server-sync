document.getElementById("saveProfileBtn").addEventListener("click", () => {
    const profile = document.getElementById("profile").value;
    const host = document.getElementById("host").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const localDir = document.getElementById("localDir").value;
    const remoteDir = document.getElementById("remoteDir").value;
    const logDir = document.getElementById("logDir").value;
    const noConnections = document.getElementById("noConnections").value;

    const config = {
        sessionUrl: `ftp://${username}:${password}@${host}`,
        remotePath: remoteDir,
        localPath: localDir,
        logPath: logDir,
        connections: noConnections
    };

    // Use electronAPI instead of ipcRenderer directly
    window.electronAPI.saveProfile(profile, config);
});