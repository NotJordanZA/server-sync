document.getElementById("saveProfileBtn").addEventListener("click", async () => {
    const profile = document.getElementById("profile").value;
    const host = document.getElementById("host").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const localDir = document.getElementById("localDir").value;
    const remoteDir = document.getElementById("remoteDir").value;
    const logDir = document.getElementById("logDir").value;
    const noConnections = document.getElementById("noConnections").value;

    // Scheduling Fields
    const scheduleType = document.getElementById("schedule").value;
    let scheduleDetails = {};

    if (scheduleType === "daily") {
        scheduleDetails = {
            type: "daily",
            time: document.getElementById("scheduleTime").value
        };
    } else if (scheduleType === "weekly") {
        scheduleDetails = {
            type: "weekly",
            day: document.getElementById("weeklyDay").value,
            time: document.getElementById("scheduleTime").value
        };
    } else if (scheduleType === "monthly") {
        scheduleDetails = {
            type: "monthly",
            day: document.getElementById("monthlyDay").value,
            time: document.getElementById("scheduleTime").value
        };
    } else if (scheduleType === "yearly") {
        scheduleDetails = {
            type: "yearly",
            dateTime: document.getElementById("yearlyDate").value
        };
    }else if(scheduleType == "never"){
        scheduleDetails = {
            type: "never",
        };
    }

    // File Mask and Retention
    const fileMask = document.getElementById("fileMask").value;
    const retentionYears = document.getElementById("retentionYears").value;

    // Profile Configuration
    const config = {
        sessionUrl: `ftp://${username}:${password}@${host}`,
        remotePath: remoteDir,
        localPath: localDir,
        logPath: logDir,
        connections: noConnections,
        schedule: scheduleDetails,
        fileMask: fileMask,
        retentionYears: retentionYears
    };

    // Use electronAPI to save the profile
    window.electronAPI.saveProfile(profile, config);

    // Handle response messages
    window.electronAPI.onSaveProfileOutput(async (message) => {
        console.log(message); // Log to console

        if (message.startsWith("Error")) {
            await window.electronAPI.showMessage("error", "Error", message);
        } else {
            window.electronAPI.closeProfile();
        }
    });
});
