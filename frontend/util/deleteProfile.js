import fs from 'fs';
import { loadProfiles } from './loadProfile.js';
import { createBatchFile } from './createBatchFile.js';
import {createBatchFilesBySchedule} from './updateScheduleBatchFiles.js'

export async function deleteProfile(name, callback) {
    const nameNoWhitespace = name.replace(/\s+/g, '');
    fs.unlink(`./syncProfiles/${nameNoWhitespace}.txt`, async function (err) {
        if (err){
            callback(`Error: ${err}`);
        }else{
            callback(`Profile Deleted Successfully`);
            // createBatchFile(await loadProfiles());
            createBatchFilesBySchedule(await loadProfiles());
        }
    });
}