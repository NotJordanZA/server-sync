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
        nextSync.textContent = `Next Sync: `;
        lastSyncSpan.textContent = await window.electronAPI.getLastSync(profile.name);
        nextSyncSpan.textContent = getNextSyncDate(profile.profileJSON.schedule);
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
    const overlay = document.getElementById("syncOverlay");
    overlay.style.display = "flex";
    const profileList = document.getElementById("profileList");

    const profilesToSync = [];

    for (const profile of profileList.children) {
        if (profile.children[0].children[0].checked) {
            profilesToSync.push(profile.children[0].children[2].children[0].textContent);
            profile.dataset.syncComplete = "false";
            profile.children[0].children[1].classList.remove("sync-success", "sync-failure");
            profile.children[0].children[1].classList.add("syncing");
        } else {
            profile.dataset.syncComplete = "true";
            profile.children[0].children[1].classList.remove("syncing", "sync-success", "sync-failure");
        }
    }

    window.electronAPI.syncProfiles(profilesToSync);

    window.electronAPI.onSyncProgress((data) => {
        const progressArray = data.split('\n');
        for (const profile of profileList.children) {
            if (progressArray[0] === profile.children[0].children[2].children[0].textContent) {
                profile.dataset.syncComplete = "true";
                profile.children[0].children[0].checked = false;
                profile.children[0].children[1].classList.remove("syncing");
                if (progressArray[1] === "Success:") {
                    profile.children[0].children[1].classList.add("sync-success");
                } else {
                    profile.children[0].children[1].classList.add("sync-failure");
                    window.electronAPI.showMessage("error", "Error Syncing Profile", data);
                }
            }
        }
    });

    // window.electronAPI.onSyncComplete(() => {
    //     clearInterval(intervalId);
    //     for (const profile of profileList.children) {
    //         profile.children[0].children[1].style.backgroundColor = "#ccc";
    //         profile.children[0].children[1].style.transition = "0.2s ease-in-out";
    //     }
    // });

    window.electronAPI.onSyncComplete(() => {
        // document.body.classList.remove("no-interaction");
        overlay.style.display = "none";
    });
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

function getNextSyncDate(schedule) {
    if (!schedule || schedule.type === "never") {
      return "Unscheduled";
    }

    const now = new Date();
    var nextSync;

    if(schedule.type === "daily"){
        const time = schedule.time.split(":");
        const todaySchedule = new Date(now.getFullYear(), now.getMonth(), now.getDate(), time[0], time[1]);
        if (now > todaySchedule) {
            todaySchedule.setDate(todaySchedule.getDate() + 1);
        }
        nextSync = todaySchedule;
    }else if(schedule.type === "weekly"){
        const time = schedule.time.split(":");
        const day = schedule.day;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        var targetDay = days.indexOf(day.toLowerCase());
        const offset = targetDay - now.getDay();
        const dayInWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate(), time[0], time[1]);
        dayInWeek.setDate(dayInWeek.getDate()-offset);
        if (now > dayInWeek) {
            dayInWeek.setDate(dayInWeek.getDate() + 7); 
        }
        nextSync = dayInWeek;
    }else if(schedule.type === "monthly"){
        const time = schedule.time.split(":");
        const day = schedule.day;
        const dayInMonth = new Date(now.getFullYear(), now.getMonth(), now.getDate(), time[0], time[1]);
        dayInMonth.setDate(day);
        if (now > dayInMonth) {
            dayInMonth.setMonth(dayInMonth.getMonth() + 1); 
        }
        nextSync = dayInMonth;
    }else if(schedule.type === "yearly"){
        const date = schedule.dateTime.slice(0,9).split("-");
        const time = schedule.dateTime.slice(11,15).split(":");
        const dayInYear = new Date(date[0], date[1], date[2], time[0], time[1]);
        if (now > dayInYear) {
            dayInYear.setFullYear(dayInYear.getFullYear() + 1);
        }
        nextSync = dayInYear;
    }

    nextSync.setHours(nextSync.getHours() + 2);
    const formattedDate = nextSync.toISOString().slice(0,16).replaceAll("-", "/").replace("T", " ");

    return formattedDate;
  }