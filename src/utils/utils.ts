import {fileURLToPath} from "url";
import path from "path";
import fs from "fs";
import Logger from "./logger.js";
import os from "os";
import convert from "color-convert";
import Config from "../config/config.js";
import {DeviceData} from "../@types/types.js";
import {SpotifyPlaybackStore} from "../store/spotify-playback-store.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '..', '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

export default class Utils {
    static clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

    static rgbToHsv = (rgb: number[]) => {
        const hsv = convert.rgb.hsv(rgb[0], rgb[1], rgb[2]);
        return {
            h: hsv[0],
            s: Utils.clamp((hsv[1] + Config.getContrastOffset()) * 10, 0, 1000),
            v: Utils.clamp((hsv[2] + Config.getContrastOffset()) * 10, 0, 1000)
        };
    }

    static resetDevices = async (devices: DeviceData[]) => {
        for (const device of devices) if (device.resetDevice != undefined) await device.resetDevice();
    }

    static generateRandomString(length: number) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    static getApplicationDirectory() {
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

    static getVersion() {
        return packageJson.version;
    }

    static getPackageName() {
        return packageJson.name;
    }

    static getEntryPoint() {
        return packageJson.main;
    }

    static calculateDynamicInterval(position: number, duration: number): number {
        const timeRemaining = duration - position;
        const maxInterval = Config.getMaxPollInterval();

        const MIN_INTERVAL = 1000;

        if (!SpotifyPlaybackStore.getNowPlaying().is_playing) {
            Logger.debug("Track is not playing, polling quickly");
            return MIN_INTERVAL;
        }

        if (SpotifyPlaybackStore.wasLastTrackSkipped()) {
            Logger.debug("Track was skipped, polling quickly");
            return MIN_INTERVAL;
        }

        if (timeRemaining <= 5000) {
            return Math.max(MIN_INTERVAL, Math.min(timeRemaining / 2, 2500));
        } else if (timeRemaining <= 30000) {
            return Math.min(timeRemaining / 4, 5000);
        } else {
            const dynamicInterval = Math.min(timeRemaining / 10, maxInterval);
            return Math.max(MIN_INTERVAL, dynamicInterval);
        }
    }
}