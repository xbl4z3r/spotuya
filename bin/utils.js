import chalk from "chalk";
import {fileURLToPath} from "url";
import path from "path";
import fs from "fs";
import Logger from "./logger.js";
import os from "os";
import convert from "color-convert";
import {DeviceType} from "./device.js";

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
    static GENERAL_QUESTIONS = [
        {
            name: 'refreshRate',
            message: 'The refresh rate in milliseconds (default: 1000):',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        },
        {
            name: 'startOnBoot',
            message: 'WARNING: This will install and use PM2\nStart SpoTuya on boot (y/n):',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        }
    ];
    static rgbToHex = (rgb, deviceType) => {
        const hsv = convert.rgb.hsv(rgb[0], rgb[1], rgb[2]);
        hsv[0] = hsv[0] / 360;
        hsv[1] = hsv[1] / 100;
        hsv[2] = hsv[2] / 100;

        let hexValue = "";
        if (deviceType === DeviceType.TYPE_A) {
            for (let value of rgb) {
                let temp = parseInt(value).toString(16);
                if (temp.length === 1) {
                    temp = "0" + temp;
                }
                hexValue += temp;
            }

            let hsvArray = [Math.round(hsv[0] * 360), Math.round(hsv[1] * 255), Math.round(hsv[2] * 255)];
            let hexValueHsv = "";
            for (let value of hsvArray) {
                let temp = parseInt(value).toString(16);
                if (temp.length === 1) {
                    temp = "0" + temp;
                }
                hexValueHsv += temp;
            }
            if (hexValueHsv.length === 7) {
                hexValue += "0" + hexValueHsv;
            } else {
                hexValue += "00" + hexValueHsv;
            }
        } else {
            let hsvArray = [Math.round(hsv[0] * 360), Math.round(hsv[1] * 1000), Math.round(hsv[2] * 1000)];
            for (let value of hsvArray) {
                let temp = value.toString(16);
                while (temp.length < 4) {
                    temp = "0" + temp;
                }
                hexValue += temp;
            }
        }

        return hexValue;
    };

    static generateRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

        for (let i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return text;
    }

    static getApplicationDirectory() {
        let directory;
        switch (os.platform()) {
            case 'win32':
                directory = path.join(process.env.APPDATA, 'spotuya');
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
                Logger.fatal('Unsupported platform');
        }
        return directory;
    }

    static getVersion() {
        return packageJson.version;
    }

    static getPackageName() {
        return packageJson.name;
    }

    static printHelpMessage() {
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya start")} ${chalk.gray("[--debug]")}`);
        Logger.info("  start: Starts the program.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya setup/wizard")} ${chalk.gray("[--devices] [--spotify] [--general] [--debug]")}`);
        Logger.info("  setup: Sets up your configuration file. If no arguments are provided, the setup wizard will perform all steps.");
        Logger.info("  --devices: Sets up your Tuya devices.");
        Logger.info("  --spotify: Sets up your Spotify credentials.");
        Logger.info("  --general: Sets up your general configuration.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya update")} ${chalk.gray("[--debug]")}`);
        Logger.info("  update: Updates your configuration file.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya config <action> <config_key> <value>")} ${chalk.gray("[--debug]")}`);
        Logger.info("  config: Updates your configuration file.");
        Logger.info("  <action>: The action to perform. Can be either 'set' or 'get'.");
        Logger.info("  <config_key>: The key to set or get.");
        Logger.info("  <value>: The value to set.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya list")} ${chalk.gray("[--debug]")}`);
        Logger.info("  update: Lists your devices.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya kill")} ${chalk.gray("[--debug]")}`);
        Logger.info("  kill: Kills the program.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya clean")} ${chalk.gray("[--debug]")}`);
        Logger.info("  clean: Cleans up your configuration file.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya version/ver/v")}`);
        Logger.info("  version: Prints the current version of SpoTuya.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya help")}`);
        Logger.info("  help: Prints this message.");
    }

    static printVersion() {
        Logger.info("Running SpoTuya v" + Utils.getVersion() + " by xbl4z3r.");
        Logger.info("  - Not affiliated with Spotify®.");
        Logger.info("  - GitHub: https://github.com/xbl4z3r/spotuya");
    }
}