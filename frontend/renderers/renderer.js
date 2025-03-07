document.addEventListener("DOMContentLoaded", async () => {
    const profileList = document.getElementById("profileList");
    const profiles = await window.electronAPI.getProfiles();
    for(const profile of profiles){
        const profileContainer = document.createElement('div');
        const profileHeading = document.createElement('h3');
        const profileSession = document.createElement('p');
        const deleteButton = document.createElement('button');

        profileHeading.textContent = profile.name;
        profileSession.textContent = profile.profileJSON.sessionUrl;
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => {
            window.electronAPI.deleteProfile(profile.name);
        });

        profileContainer.appendChild(profileHeading);
        profileContainer.appendChild(profileSession);
        profileContainer.appendChild(deleteButton);
        profileList.appendChild(profileContainer);
    }
});

document.getElementById("syncBtn").addEventListener("click", () => {
    // const host = document.getElementById("host").value;
    // const username = document.getElementById("username").value;
    // const password = document.getElementById("password").value;
    // const localDir = document.getElementById("localDir").value;
    // const remoteDir = document.getElementById("remoteDir").value;
    // const logDir = document.getElementById("logDir").value;
    // const noConnections = document.getElementById("noConnections").value;

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