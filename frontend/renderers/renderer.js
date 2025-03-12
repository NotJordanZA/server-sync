document.addEventListener("DOMContentLoaded", async () => {
    const profileList = document.getElementById("profileList");
    const profiles = await window.electronAPI.getProfiles();
    for(const profile of profiles){
        const profileContainer = document.createElement('div');
        const profileInfoContainer = document.createElement('div');

        const checkLabel = document.createElement('label');
        const checkBox = document.createElement('input');
        const checkSpan = document.createElement('span');
        const profileHeading = document.createElement('h3');
        const lastSync = document.createElement('p');
        const nextSync = document.createElement('p');
        const lastSyncSpan = document.createElement('span');
        const nextSyncSpan = document.createElement('span');
        const deleteButton = document.createElement('button');
        const updateButton = document.createElement('button');

        profileContainer.className = "profileContainer";
        profileInfoContainer.className = "profileInfoContainer";
        checkBox.className = "checkbox";
        profileHeading.className = "profileHeading";
        lastSync.className = "syncDetail";
        nextSync.className = "syncDetail";
        deleteButton.className = "deleteButton";
        updateButton.className = "updateButton";

        checkLabel.htmlFor = `profileCheck_${profile.name}`;
        // checkLabel.style.cursor = "pointer";
        checkBox.type = "checkbox";
        checkBox.id = `profileCheck_${profile.name}`;
        checkSpan.className = "checkmark";
        profileHeading.textContent = profile.name;
        lastSync.textContent = "Last Sync: ";
        nextSync.textContent = "Next Sync: ";
        lastSyncSpan.textContent = "Never";
        nextSyncSpan.textContent = "Unscheduled";
        deleteButton.textContent = "Delete";
        updateButton.textContent = "Edit";

        deleteButton.addEventListener("click", async() => {
            const response = await window.electronAPI.showDeleteMessage(`Are you sure you want to delete ${profile.name}?`);
            if(response.response === 0){
                window.electronAPI.deleteProfile(profile.name);
            }
        });
        updateButton.addEventListener("click", () => {
            window.electronAPI.openUpdateProfile(profile.name);
        });

        lastSync.appendChild(lastSyncSpan);
        nextSync.appendChild(nextSyncSpan);

        profileInfoContainer.appendChild(profileHeading);
        profileInfoContainer.appendChild(lastSync);
        profileInfoContainer.appendChild(nextSync);
        profileInfoContainer.appendChild(updateButton);
        profileInfoContainer.appendChild(deleteButton);

        profileContainer.appendChild(checkBox);
        profileContainer.appendChild(checkSpan);
        profileContainer.appendChild(profileInfoContainer);
        checkLabel.appendChild(profileContainer);

        profileList.appendChild(checkLabel);
    }
});

document.getElementById("syncBtn").addEventListener("click", () => {
    const profileList = document.getElementById("profileList");

    const profilesToSync = [];

    for (const profile of profileList.children) {
        checked = profile.children[0].children[0].checked;
        if(checked){
            profilesToSync.push(profile.children[0].children[2].children[0].textContent);
        }
    }
    console.log(profilesToSync);
    // window.electronAPI.syncProfiles(profilesToSync);
});

document.getElementById("selectAllBtn").addEventListener("click", () => {
    const profileList = document.getElementById("profileList");
    var checkCount = false;
    for (const profile of profileList.children) {
        if(!profile.children[0].children[0].checked){
            profile.children[0].children[0].click();
            checkCount = true;
        }
    }
    if(!checkCount){
        for (const profile of profileList.children) {
            profile.children[0].children[0].click();
        }
    }
});

// Listen for PowerShell output
window.electronAPI.onPowerShellOutput((data) => {
    document.getElementById("output").innerText = data;
});

document.getElementById("newProfileBtn").addEventListener("click", () => {
    window.electronAPI.openNewProfile();
});