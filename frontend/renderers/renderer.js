document.addEventListener("DOMContentLoaded", async () => {
    const profileList = document.getElementById("profileList");
    const profiles = await window.electronAPI.getProfiles();
    for(const profile of profiles){
        const profileContainer = document.createElement('div');
        const profileInfoContainer = document.createElement('div');

        const checkBox = document.createElement('input');
        const profileHeading = document.createElement('h3');
        const profileSession = document.createElement('p');
        const deleteButton = document.createElement('button');
        const updateButton = document.createElement('button');

        checkBox.type = "checkbox";
        profileHeading.textContent = profile.name;
        profileSession.textContent = profile.profileJSON.sessionUrl;
        deleteButton.textContent = "Delete";
        updateButton.textContent = "Edit";

        deleteButton.addEventListener("click", () => {
            window.electronAPI.deleteProfile(profile.name);
        });
        updateButton.addEventListener("click", () => {
            window.electronAPI.openUpdateProfile(profile.name);
        });

        profileInfoContainer.appendChild(profileHeading);
        profileInfoContainer.appendChild(profileSession);
        profileInfoContainer.appendChild(updateButton);
        profileInfoContainer.appendChild(deleteButton);

        profileContainer.appendChild(checkBox);
        profileContainer.appendChild(profileInfoContainer);

        profileList.appendChild(profileContainer);
    }
});

document.getElementById("syncBtn").addEventListener("click", () => {
    const profileList = document.getElementById("profileList");

    // console.log(profileList.children[0].children[0].checked);
    const profilesToSync = [];

    for (const profile of profileList.children) {
        checked = profile.children[0].checked;
        if(checked){
            profilesToSync.push(profile.children[1].children[0].textContent);
        }
    }
    // console.log(profilesToSync);
    window.electronAPI.syncProfiles(profilesToSync);
});

// Listen for PowerShell output
window.electronAPI.onPowerShellOutput((data) => {
    document.getElementById("output").innerText = data;
});

document.getElementById("newProfileBtn").addEventListener("click", () => {
    window.electronAPI.openNewProfile();
});