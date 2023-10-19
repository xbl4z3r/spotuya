import chalk from "chalk";
import {fileURLToPath} from "url";
import path from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

export default class Utils {
    static SPOTIFY_COLOR = "#1DB954";
    static DEFAULT_STATE = {
        powered: false,
        color: "010403200302"
    }
    static CREDENTIAL_QUESTIONS = [
        {
            name: 'clientId',
            message: 'The Spotify Application client ID:',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        },
        {
            name: 'clientSecret',
            message: 'The Spotify Application client secret:',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        }
    ];
    static TUYA_API_QUESTIONS = [
        {
            name: 'apiKey',
            message: 'The API key from iot.tuya.com/cloud:',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        },
        {
            name: 'apiSecret',
            message: 'The API secret from iot.tuya.com/cloud',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        }
    ];
    static hsvToHex = (h, s, v) => {
        // turn the contrast to the max
        if (s < 0.6) s += 0.25;
        let hex_value = "";
        let hsv_array = [Math.round(h * 360), Math.round(s * 1000), Math.round(v * 1000)];
        for (let value of hsv_array) {
            let temp = value.toString(16).replace("0x", "");
            while (temp.length < 4) {
                temp = "0" + temp;
            }
            hex_value += temp;
        }
        return hex_value;
    };

    static generateRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    static getVersion() {
        return packageJson.version;
    }
}