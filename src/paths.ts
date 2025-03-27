import os from "os";
import path from "path";
import fs from "fs";
import {fileURLToPath} from "url";
import Logger from "./logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getApplicationDirectory() {
    let directory = "";
    try {
        switch (os.platform()) {
            case 'win32':
                directory = path.join(process.env.APPDATA || "", 'spotuya');
                if (!fs.existsSync(directory)) fs.mkdirSync(directory);
                break;
            case 'linux':
                directory = path.join(os.homedir(), '.config', 'spotuya');
                if (!fs.existsSync(directory)) fs.mkdirSync(directory);
                break;
            case 'darwin':
                directory = path.join(os.homedir(), 'Library', 'Application Support', 'spotuya');
                if (!fs.existsSync(directory)) fs.mkdirSync(directory);
                break;
            case "android":
                directory = path.join(os.homedir(), 'spotuya');
                if (!fs.existsSync(directory)) fs.mkdirSync(directory);
                break;
            default:
                Logger.fatal(`Unsupported platform ${os.platform()}. Exiting...`);
        }
    } catch (err) {
        try {
            Logger.warn(`Error while getting application directory system-wide: ${err}`);
            Logger.warn("Falling back to local directory...");
            directory = path.join(__dirname, '..', 'config');
            if (!fs.existsSync(directory)) fs.mkdirSync(directory);
        } catch (err) {
            Logger.warn("Unable to create local directory. Do you have write permissions?");
        }
    }
    return directory;
}