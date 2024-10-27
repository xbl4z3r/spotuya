import chalk from "chalk";
import {fileURLToPath} from "url";
import path from "path";
import fs from "fs";
import Logger from "./logger.js";
import os from "os";
import convert from "color-convert";
import Config from "./config.js";
import Cloud from "./cloud.js";
import inquirer from "inquirer";
import {SpotifyTokenStore} from "./spotify.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

export default class Utils {
    static SPOTIFY_COLOR = "#1DB954";
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
            name: 'clientId',
            message: 'The Client ID from iot.tuya.com/cloud:',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        },
        {
            name: 'clientSecret',
            message: 'The Client Secret from iot.tuya.com/cloud',
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
        },
        {
            name: 'port',
            message: 'The port to run Spotify callbacks on (default: 4815):',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        },
        {
            name: 'colorPalette',
            message: 'The color palette to use (-1: Cycle, 0: Vibrant, 1: DarkVibrant, 2: LightVibrant, 3: Muted, 4: DarkMuted, 5: LightMuted):',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        },
        {
            name: 'cycleRate',
            message: 'The cycle rate in milliseconds (default: 5000):',
            prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
        }
    ];
    
    static clamp = (num, min, max) => Math.min(Math.max(num, min), max);
    
    static rgbToHsv = (rgb) => {
        const hsv = convert.rgb.hsv(rgb[0], rgb[1], rgb[2]);
        return { 
            h: hsv[0], 
            s: Utils.clamp((hsv[1] + 50) * 10, 0, 1000), 
            v: Utils.clamp((hsv[2] + 50) * 10, 0, 1000) 
        };
    }

    static generateRandomString(length) {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
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
                Logger.fatal(`Unsupported platform ${os.platform()}. Exiting...`);
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
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya setup/wizard")} ${chalk.gray("[--devices] [--spotify] [--spotuya] [--debug]")}`);
        Logger.info("  setup: Sets up your configuration file. If no arguments are provided, the setup wizard will perform all steps.");
        Logger.info("  --devices: Sets up your Tuya devices.");
        Logger.info("  --spotify: Sets up your Spotify credentials.");
        Logger.info("  --spotuya: Sets up your SpoTuya configuration.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya upgrade")} ${chalk.gray("[--debug]")}`);
        Logger.info("  upgrade: Upgrades your configuration file.");
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

    static listDevices = () => {
        Logger.info("Devices in your configuration file:");
        Config.getDevices().forEach((device, index) => {
            Logger.info("Device " + (index + 1) + ": ID " + device.id + " | Key " + device.key);
        });
    }

    static disableConfigWarnings = () => {
        if (Config.getConfigVersion() === Utils.getVersion()) return Logger.info("Config warning is already disabled.");
        Config.setConfigVersion(Utils.getVersion());
        Logger.info("Disabled the config warning.");
    }

    static handleSetup = async (args) => {
        const flagArgs = args.filter(arg => arg.startsWith("--"));
        try {
            // Determine what setup steps to run
            let fullSetup = false;
            if (!args.includes("--devices") && Config.getDevices().length === 0) return Logger.fatal("You can't run the setup without devices if you don't have any devices in your configuration file.");
            if (!args.includes("--spotify") && Config.getSpotifyConfig().accessToken === "") return Logger.fatal("You can't run the setup without Spotify if you don't have a Spotify access token in your configuration file.");
            if (!args.includes("--general") && Config.getRefreshRate() === undefined || Config.getStartOnBoot() === undefined) return Logger.fatal("You can't run the setup without general settings if you don't have a refresh rate or start on boot in your configuration file.");
            if (flagArgs.length === 0 || flagArgs.length === 1 && flagArgs.includes("--debug")) fullSetup = true;

            // Tuya API setup
            if (args.includes("--devices") || fullSetup) {
                const {devices, userId, region, clientId, clientSecret} = await Cloud.wizard();
                Config.addDevices(devices);
                Config.setTuyaConfig({userId, region, clientId, clientSecret});
                Logger.info("Successfully imported your devices!");
            }

            // Spotify setup
            if (args.includes("--spotify") || fullSetup) {
                const spotifyConfig = Config.getSpotifyConfig();
                const answers = await inquirer.prompt(Utils.CREDENTIAL_QUESTIONS);
                spotifyConfig.clientId = answers.clientId;
                spotifyConfig.clientSecret = answers.clientSecret;
                Config.setSpotifyConfig(spotifyConfig);
                SpotifyTokenStore.setClientId(spotifyConfig.clientId);
                SpotifyTokenStore.setClientSecret(spotifyConfig.clientSecret);
                await SpotifyTokenStore.setup();
                let tokens = await SpotifyTokenStore.getAccessToken();
                spotifyConfig.accessToken = tokens.access_token;
                if (tokens.refresh_token) spotifyConfig.refreshToken = tokens.refresh_token;
                Config.setSpotifyConfig(spotifyConfig);
                Logger.info("Successfully saved your Spotify credentials!");
            }

            // Application setup
            if (args.includes("--spotuya") || fullSetup) {
                const answers = await inquirer.prompt(Utils.GENERAL_QUESTIONS);
                Config.setRefreshRate(answers.refreshRate);
                Config.setStartOnBoot(answers.startOnBoot === "y" || answers.startOnBoot === "yes");
                Config.setPort(answers.port);
                Config.setPaletteMode(answers.colorPalette);
                Config.setCycleRate(answers.cycleRate);
                Logger.info("Successfully saved your SpoTuya settings!");
            }

            Logger.info("Successfully set up your configuration file. You can now run `spotuya start` to start the program.");
        } catch (err) {
            Logger.fatal("Error while setting up... Make sure your details are correct and try again.");
        }
    }
}