import fs from 'fs';
import { loadProfiles } from './loadProfile.js';
import { createBatchFilesBySchedule } from './updateScheduleBatchFiles.js';
import { deleteProfile } from './deleteProfile.js';

export async function updateProfile(name, originalName, config, callback) {
    if (!config) {
        callback("Error: config is undefined");
        return;
    }

    const nameNoWhitespace = name.replace(/\s+/g, '');
    
    try {
        const jsonString = JSON.stringify(config, null, 2);

        if(name !== originalName){
            deleteProfile(originalName, ()=>{});
            fs.rename(`./logs/${originalName}_log.txt`, `./logs/${nameNoWhitespace}_log.txt`, function (err) {
                if (err) {
                    callback(`Error renaming log file: ${err}`);
                } else {
                    callback("Renamed Log file Successfully");
                }
            });
            fs.rename(`./manualSyncLogs/${originalName}_log.txt`, `./logs/${nameNoWhitespace}_log.txt`, function (err) {
                if (err) {
                    callback(`Error renaming log file: ${err}`);
                } else {
                    callback("Renamed Log file Successfully");
                }
            });
        }

        fs.writeFile(`./syncProfiles/${nameNoWhitespace}.txt`, jsonString, async function (err) {
            if (err) {
                callback(`Error: ${err}`);
            } else {
                callback("Profile Updated Successfully");

                const updatedProfiles = await loadProfiles();
                
                if (Array.isArray(updatedProfiles)) {
                    createBatchFilesBySchedule(updatedProfiles);
                } else {
                    callback("Error: Expected profiles to be an array, but got:", updatedProfiles);
                }
            }
        });
    } catch (error) {
        callback(`Error loading profiles: ${error.message}`);
    }
}