import fs from 'fs';
import { loadProfiles } from './loadProfile.js';
import { createBatchFile } from './createBatchFile.js';
import {createBatchFilesBySchedule} from './updateScheduleBatchFiles.js'


export async function saveProfile(name, config, callback) {
    if (!config) {
        callback("Error: config is undefined");
        return;
    }

    const nameNoWhitespace = name.replace(/\s+/g, '');
    
    try {
        const profiles = await loadProfiles();
        
        if (profiles.some(profile => profile.name === nameNoWhitespace)) {
            callback(`Error: A profile with the name "${name}" already exists.`);
            return;
        }

        const jsonString = JSON.stringify(config, null, 2);

        fs.writeFile(`./syncProfiles/${nameNoWhitespace}.txt`, jsonString, async function (err) {
            if (err) {
                callback(`Error: ${err}`);
            } else {
                callback("Profile Saved Successfully");

                const updatedProfiles = await loadProfiles();
                
                if (Array.isArray(updatedProfiles)) {
                    // createBatchFile(updatedProfiles);
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