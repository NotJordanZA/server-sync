import fs from 'fs';

export function saveProfile(name, config, callback) {
    const nameNoWhitespace = name.replace(/\s+/g, '');
    const jsonString = JSON.stringify(config, null, 2);
    fs.writeFile(`./syncProfiles/${nameNoWhitespace}.txt`, jsonString, function (err) {
        if (err){
            callback(`Error: ${err}`);
        }else{
            callback(`Profile Saved Successfully`);
        }
    });
}