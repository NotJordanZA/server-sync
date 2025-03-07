import { fileURLToPath } from "url";
import { promises as fs } from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadProfileWithPath(filepath) {
    try {
        const data = await fs.readFile(filepath, "utf8");
        return JSON.parse(data);
    } catch (err) {
        if (err.code === "ENOENT") {
            console.error("File not found:", err.path);
        } else {
            console.error("Error reading file:", err);
        }
        return null;
    }
}

export async function loadProfiles(){
    try {
        const profilePath = path.join(__dirname, "../syncProfiles");
        const files = await fs.readdir(profilePath);
        let profilesArray = [];

        for (const file of files) {
            const filePath = path.join(profilePath, file);
            const profileJSON = await loadProfileWithPath(filePath);
            const name = file.replace('.txt', '');

            if (profileJSON) {
                profilesArray.push({ name, profileJSON });
            }
        }

        return profilesArray;
    } catch (e) {
        console.error("Error loading profiles:", e);
        return []; 
    }
}