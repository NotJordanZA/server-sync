import fs from 'fs';
import { loadProfiles } from './loadProfile.js';
import { createBatchFile } from './createBatchFile.js';

export async function updateProfile(name, config, callback) {
    if (!config) {
        callback("Error: config is undefined");
        return;
    }

    const nameNoWhitespace = name.replace(/\s+/g, '');
    
    try {
        const jsonString = JSON.stringify(config, null, 2);

        fs.writeFile(`./syncProfiles/${nameNoWhitespace}.txt`, jsonString, async function (err) {
            if (err) {
                callback(`Error: ${err}`);
            } else {
                callback("Profile Updated Successfully");

                const updatedProfiles = await loadProfiles();
                
                if (Array.isArray(updatedProfiles)) {
                    createBatchFile(updatedProfiles);
                } else {
                    callback("Error: Expected profiles to be an array, but got:", updatedProfiles);
                }
            }
        });
    } catch (error) {
        callback(`Error loading profiles: ${error.message}`);
    }
}