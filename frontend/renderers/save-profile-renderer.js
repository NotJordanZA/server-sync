window.electronAPI.onUpdateProfilePageLoad( async (config) => {
    await populateConnectionProfileSelect();

    document.getElementById("saveProfileBtn").textContent = "Update Profile";
    document.getElementById("saveProfileBtn").onclick = () => handleProfileSave(true, config.name);

    const profile = document.getElementById("profile");
    const connectionProfile = document.getElementById("connectionProfile");
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

    connectionProfile.value = config.profileJSON.connectionProfile;
    if (connectionProfile.value !== "Create New Connection"){
        const hostLabel = document.getElementById("host-label");
        const usernameLabel = document.getElementById("username-label");
        const passwordLabel = document.getElementById("password-label");

        hostLabel.style.display = "none";
        usernameLabel.style.display = "none";
        passwordLabel.style.display = "none";
    }
    console.log("Post connection profile: ", connectionProfile.value);
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

async function handleProfileSave(isUpdate = false, originalName = null) {
    const profile = document.getElementById("profile").value;
    const connectionProfile = document.getElementById("connectionProfile");
    const connectionProfileValue = connectionProfile.options[connectionProfile.selectedIndex].text;
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

    const requiredFields = [
        { value: profile, name: "Profile Name" },
        { value: localDir, name: "Local Directory" },
        { value: remoteDir, name: "Remote Directory" }
    ];
    
    let isMissingRequired = false;
    let requiredFieldMessage = "You are missing the following required field(s):\n";
    
    requiredFields.forEach(field => {
        if (!field.value) {
            isMissingRequired = true;
            requiredFieldMessage += `\t${field.name}\n`;
        }
    });
    
    if (connectionProfileValue === "Create New Connection") {
        if (!host) {
            isMissingRequired = true;
            requiredFieldMessage += `\tHost\n`;
        }
        if (!username) {
            isMissingRequired = true;
            requiredFieldMessage += `\tUsername\n`;
        }
        if (!password) {
            isMissingRequired = true;
            requiredFieldMessage += `\tPassword\n`;
        }
    }

    if(!isMissingRequired){
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
    
        var config = {};
        
        if (connectionProfileValue === "Create New Connection"){
            const connectionConfig = {
                host: host,
                username: username,
                password: password
            }
    
            window.electronAPI.saveConnectionProfile(connectionConfig);
    
            config = {
                connectionProfile: `${username}@${host}`,
                remotePath: remoteDir,
                localPath: localDir,
                logPath: logDir,
                connections: noConnections,
                schedule: scheduleDetails,
                fileMask: fileMask,
                retentionYears: retentionYears,
                email: email,
            };
        }else{
            config = {
                connectionProfile: `${connectionProfileValue}`,
                remotePath: remoteDir,
                localPath: localDir,
                logPath: logDir,
                connections: noConnections,
                schedule: scheduleDetails,
                fileMask: fileMask,
                retentionYears: retentionYears,
                email: email,
            };
        }
    
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
    }else{
        await window.electronAPI.showMessage("error", "Error", requiredFieldMessage);
    }
}

document.getElementById("saveProfileBtn").onclick = () => handleProfileSave();


async function populateConnectionProfileSelect() {
    try {
        const connectionProfiles = await window.electronAPI.getConnectionProfiles();
        const selectElement = document.getElementById("connectionProfile");
        const uniqueOptions = new Set();

        var options= selectElement.options;
        for (var i= 0; i<options.length; i++) {
            uniqueOptions.add(options[i].value);
        }
  
        connectionProfiles.forEach(profile => {
            const optionValue = `${profile.username}@${profile.host}`;
            if (!uniqueOptions.has(optionValue)) {
            uniqueOptions.add(optionValue);
            const option = document.createElement("option");
            option.value = optionValue;
            option.textContent = optionValue;
            selectElement.appendChild(option);
            }
        });
        } catch (error) {
        console.error("Error loading connection profiles:", error);
        }
  }

document.getElementById("connectionProfile").onchange = () =>{
    const selection = document.getElementById("connectionProfile").value;
    const host = document.getElementById("host-label");
    const username = document.getElementById("username-label");
    const password = document.getElementById("password-label");
    if (selection === "Create New Connection"){
        host.style.display = "block";
        username.style.display = "block";
        password.style.display = "block";
    }else{
        host.style.display = "none";
        username.style.display = "none";
        password.style.display = "none";
    }
}

document.addEventListener("DOMContentLoaded", function () {
    populateConnectionProfileSelect();
});