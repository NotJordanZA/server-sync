window.electronAPI.onUpdateProfilePageLoad((config) => {
    document.getElementById("saveProfileBtn").textContent = "Update Profile";
    document.getElementById("saveProfileBtn").onclick = () => handleProfileSave(true, config.name);

    const profile = document.getElementById("profile");
    const host = document.getElementById("host");
    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const localDir = document.getElementById("localDir");
    const remoteDir = document.getElementById("remoteDir");
    const logDir = document.getElementById("logDir");
    const noConnections = document.getElementById("noConnections");
    const scheduleType = document.getElementById("schedule");
    const scheduleDetails = document.getElementById("scheduleDetails");
    const fileMask = document.getElementById("fileMask");
    const retentionYears = document.getElementById("retentionYears");
    const email = document.getElementById("email");
    const timeInput = document.getElementById("scheduleTime");
    const weeklyOptions = document.getElementById("weeklyOptions");
    const monthlyOptions = document.getElementById("monthlyOptions");
    const yearlyOptions = document.getElementById("yearlyOptions");
    const scheduleLabel = document.getElementById("scheduleLabel");

    profile.value = config.name;

    const regex = /ftp:\/\/(?:([^:@]+):([^:@]+)@)?([^\/]+)(\/.*)?/;
    const match = config.profileJSON.sessionUrl.match(regex);

    host.value = match[3];
    username.value = match[1];
    password.value = match[2];
    localDir.value = config.profileJSON.localPath;
    remoteDir.value = config.profileJSON.remotePath;
    logDir.value = config.profileJSON.logPath;
    noConnections.value = config.profileJSON.connections;
    email.value = config.profileJSON.email;

    if(config.profileJSON.schedule){
        const schedule = config.profileJSON.schedule;
        scheduleDetails.style.display = "block";
        if (schedule.type === "daily") {
            scheduleType.value = "daily";
            document.getElementById("scheduleTime").value = schedule.time;
            scheduleDetails.style.display = "block";
            timeInput.style.display = "block";
            scheduleLabel.style.display = "block";
        } else if (schedule.type === "weekly") {
            scheduleType.value = "weekly";
            document.getElementById("scheduleTime").value = schedule.time;
            document.getElementById("weeklyDay").value = schedule.day;ElementById("scheduleTime").value;
            scheduleDetails.style.display = "block";
            timeInput.style.display = "block";
            weeklyOptions.style.display = "block";
            scheduleLabel.style.display = "block";
        } else if (schedule.type === "monthly") {
            scheduleType.value = "monthly";
            document.getElementById("scheduleTime").value = schedule.time;
            document.getElementById("monthlyDay").value = schedule.day;
            scheduleDetails.style.display = "block";
            timeInput.style.display = "block";
            monthlyOptions.style.display = "block";
            scheduleLabel.style.display = "block";
        } else if (schedule.type === "yearly") {
            scheduleType.value = "yearly";
            document.getElementById("yearlyDate").value = schedule.dateTime;
            scheduleDetails.style.display = "block";
            yearlyOptions.style.display = "block";
        }else if(schedule.type == "never"){
            scheduleType.value = "never";
            scheduleDetails.style.display = "none";
        }
    }

    config.profileJSON.fileMask? fileMask.value = config.profileJSON.fileMask : "";
    config.profileJSON.retentionYears? retentionYears.value = config.profileJSON.retentionYears : "";
})

function handleProfileSave(isUpdate = false, originalName = null) {
    const profile = document.getElementById("profile").value;
    const host = document.getElementById("host").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const localDir = document.getElementById("localDir").value;
    const remoteDir = document.getElementById("remoteDir").value;
    const logDir = document.getElementById("logDir").value;
    const noConnections = document.getElementById("noConnections").value;
    const scheduleType = document.getElementById("schedule").value;
    const fileMask = document.getElementById("fileMask").value;
    const retentionYears = document.getElementById("retentionYears").value;
    const email = document.getElementById("email").value;

    let scheduleDetails = {};
    if (scheduleType === "daily") {
        scheduleDetails = { type: "daily", time: document.getElementById("scheduleTime").value };
    } else if (scheduleType === "weekly") {
        scheduleDetails = { type: "weekly", day: document.getElementById("weeklyDay").value, time: document.getElementById("scheduleTime").value };
    } else if (scheduleType === "monthly") {
        scheduleDetails = { type: "monthly", day: document.getElementById("monthlyDay").value, time: document.getElementById("scheduleTime").value };
    } else if (scheduleType === "yearly") {
        scheduleDetails = { type: "yearly", dateTime: document.getElementById("yearlyDate").value };
    } else if (scheduleType == "never") {
        scheduleDetails = { type: "never" };
    }

    const config = {
        sessionUrl: `ftp://${username}:${password}@${host}`,
        remotePath: remoteDir,
        localPath: localDir,
        logPath: logDir,
        connections: noConnections,
        schedule: scheduleDetails,
        fileMask: fileMask,
        retentionYears: retentionYears,
        email: email,
    };

    if (isUpdate) {
        window.electronAPI.updateProfile(profile, originalName, config);
        window.electronAPI.onUpdateProfileOutput(async (message) => {
            console.log(message);
            if (message.startsWith("Error")) {
                await window.electronAPI.showMessage("error", "Error", message);
            } else {
                window.electronAPI.closeProfile();
            }
        });
    } else {
        window.electronAPI.saveProfile(profile, config);
        window.electronAPI.onSaveProfileOutput(async (message) => {
            console.log(message);
            if (message.startsWith("Error")) {
                await window.electronAPI.showMessage("error", "Error", message);
            } else {
                window.electronAPI.closeProfile();
            }
        });
    }

    
}

document.getElementById("saveProfileBtn").onclick = () => handleProfileSave();
