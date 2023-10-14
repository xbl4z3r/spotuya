#!/usr/bin/env node

/*
    Tuya API
 */
import TuyAPI from "tuyapi";
import Cloud from "./cloud.js";

/*
    Spotify API
 */
import SpotifyWebApi from "spotify-web-api-node";
import SpotifyAccessToken from "./spotify.js";

/*
    Other
 */
import Vibrant from "node-vibrant";
import convert from "color-convert";
import chalk from "chalk";

/*
    Config
 */
import Config from "./config.js";
import Logger from "./logger.js";
import Utils from "./utils.js";

import fs from "fs";
import {fileURLToPath} from 'url';
import path from "path";
import inquirer from "inquirer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const SPOTUYA_VERSION = packageJson.version;
console.log(chalk.hex(Utils.SPOTIFY_COLOR).bold(" .oooooo..o                      ooooooooooooo                                   \n" +
    "d8P'    `Y8                      8'   888   `8                                   \n" +
    "Y88bo.      oo.ooooo.   .ooooo.       888      oooo  oooo  oooo    ooo  .oooo.   \n" +
    " `\"Y8888o.   888' `88b d88' `88b      888      `888  `888   `88.  .8'  `P  )88b  \n" +
    "     `\"Y88b  888   888 888   888      888       888   888    `88..8'    .oP\"888  \n" +
    "oo     .d8P  888   888 888   888      888       888   888     `888'    d8(  888  \n" +
    "8\"\"88888P'   888bod8P' `Y8bod8P'     o888o      `V88V\"V8P'     .8'     `Y888\"\"8o \n" +
    "             888                                           .o..P'                \n" +
    "            o888o                                          `Y8P'                 \n" +
    "                                                                                 "));
console.log(chalk.white.bold("> Made with " + chalk.red("♥") + " by " + chalk.hex(Utils.SPOTIFY_COLOR)("xbl4z3r") + " | v" + SPOTUYA_VERSION + " | Not affiliated with " + chalk.hex(Utils.SPOTIFY_COLOR)("Spotify®")));

const DEFAULT_STATE = {
    powered: false,
    color: "010403200302"
}

const args = process.argv.slice(2);

const tuyaDevices = [], initialStates = [];
(async () => {
    if (args.includes("--debug")) Logger.setDebugMode(true);
    const config = Config.getConfigFromDisk(args.includes("--clean"));
    const refreshRate = config.refreshRate;

    // filter all the args that start with -- and check if there are any
    let nonFlagArgs = args.filter(arg => !arg.startsWith("--"));
    if (nonFlagArgs.length === 0) Logger.fatal("No arguments provided. Please run `spotuya help` for more information.");

    if (!args.includes("setup") && !args.includes("wizard") && config.devices.length === 0) Logger.fatal("No devices found! Make sure your config.json file is correct. To set up your config.json file, please run `spotuya setup`.");
    else if (args.includes("setup") || args.includes("wizard")) {
        try {
            if (!args.includes("--no-devices")) {
                const devices = await Cloud.wizard();
                devices.forEach(device => Config.addDevice(device));
                Logger.info("Successfully imported your devices!");
            }

            if (config.accessToken === "") {
                Logger.debug("No Spotify access token found. Prompting user to log in...");
                if(config.clientId === "" || config.clientSecret === "")
                {
                    const answers = await inquirer.prompt(Utils.CREDENTIAL_QUESTIONS);
                    config.clientId = answers.clientId;
                    config.clientSecret = answers.clientSecret;
                    SpotifyAccessToken.CLIENT_ID = config.clientId;
                    Config.saveConfig(config);
                }
                await SpotifyAccessToken.setup();
                config.accessToken = await SpotifyAccessToken.getAccessToken();
                Config.saveConfig(config);
                Logger.info("Successfully saved access token to config.json file.");
            }

            Logger.info("Successfully set up your config.json file! Please restart the program.");
            process.exit(0);
        } catch (err) {
            Logger.fatal("Error while setting up... Make sure your details are correct and try again.");
        }
    } else if (args.includes("help")) {
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya start")} [--debug]`);
        Logger.info("  start: Starts the program.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya setup/wizard")} [--no-devices] [--clean] [--debug]`);
        Logger.info("  setup: Sets up your config.json file.");
        Logger.info("  --no-devices: Skips the device setup wizard.");
        Logger.info("  --clean: Cleans your config.json file.");
        Logger.info("  --debug: Enables debug mode.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya version/ver/v")}`);
        Logger.info("  version: Prints the current version of SpoTuya.");
        Logger.info("");
        Logger.info(`Usage: ${chalk.hex(Utils.SPOTIFY_COLOR)("spotuya help")}`);
        Logger.info("  help: Prints this message.");
    } else if (args.includes("version") || args.includes("ver") || args.includes("v")) {
        Logger.info("Running SpoTuya v" + SPOTUYA_VERSION + " by xbl4z3r.");
    } else if (args.includes("start")) {

        Logger.info("Checking config...")
        if (config.devices === undefined || config.refreshRate === undefined || config.accessToken === undefined) Logger.fatal("Invalid config.json file. Please run `spotuya setup --clean` to set up your config.json file.");
        if (config.refreshRate < 200) {
            config.refreshRate = 200;
            Config.saveConfig(config);
            Logger.warn("Your refresh rate was too low and has been updated to 200ms.");
        }

        Logger.info("Checking Spotify access token...");
        if (config.accessToken === "") {
            Logger.debug("No Spotify access token found. Prompting user to log in...");
            if(config.clientId === "" || config.clientSecret === "")
            {
                const answers = await inquirer.prompt(Utils.CREDENTIAL_QUESTIONS);
                config.clientId = answers.clientId;
                config.clientSecret = answers.clientSecret;
                SpotifyAccessToken.CLIENT_ID = config.clientId;
                Config.saveConfig(config);
            }
            await SpotifyAccessToken.setup();
            config.accessToken = await SpotifyAccessToken.getAccessToken();
            Config.saveConfig(config);
            Logger.info("Successfully saved access token to config.json file.");
        }

        const spotifyApi = new SpotifyWebApi({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            scope: 'user-read-currently-playing user-read-playback-state',
        });

        spotifyApi.setAccessToken(config.accessToken);

        Logger.info("Loading devices...");
        const setState = [];
        let isPlaying = false;
        for (let device of config.devices) {
            if (device.id !== undefined && device.key !== undefined) {
                tuyaDevices.push(new TuyAPI({
                    id: device.id,
                    key: device.key,
                    issueGetOnConnect: true
                }));
                initialStates.push(DEFAULT_STATE);
                setState.push(false);
            } else {
                Logger.error("Invalid device config");
                continue;
            }

            // Find device on network
            tuyaDevices[tuyaDevices.length - 1].find().then(() => {
                // Connect to device
                tuyaDevices[tuyaDevices.length - 1].connect();
            });

            // Add event listeners
            tuyaDevices[tuyaDevices.length - 1].on('connected', async () => {
                let id = tuyaDevices.length - 1;
                Logger.debug('Connected to device.');
                setInterval(async () => {
                    try {
                        spotifyApi.getMyCurrentPlaybackState()
                            .then(async function (data) {
                                if (data.body.is_playing) {
                                    isPlaying = true;
                                    setState[id] = false;
                                    await Vibrant.from(data.body.item.album.images[0].url).getPalette(async (err, palette) => {
                                        const rgb = palette.Vibrant.rgb;
                                        const hsv = convert.rgb.hsv(rgb[0], rgb[1], rgb[2]);
                                        const hex_value = Utils.hsvToHex(hsv[0] / 360, hsv[1] / 100, hsv[2] / 100);
                                        tuyaDevices[id].set({
                                            multiple: true,
                                            data: {
                                                '20': true,
                                                '24': hex_value,
                                            },
                                            shouldWaitForResponse: false
                                        });
                                    })
                                } else {
                                    isPlaying = false;
                                    if (!setState[id]) {
                                        setState[id] = true;
                                        tuyaDevices[id].set({
                                            multiple: true,
                                            data: {
                                                '20': initialStates[id].powered,
                                                '24': initialStates[id].color,
                                            },
                                            shouldWaitForResponse: false
                                        });
                                    }
                                }
                            }, () => Logger.fatal("Something went wrong while checking the current song. Check your config.json file."));
                    } catch (err) {
                        Logger.fatal("Something went wrong while checking the current song. Check your config.json file.");
                    }
                }, refreshRate);
            });

            tuyaDevices[tuyaDevices.length - 1].on('data', data => {
                if (data.dps === undefined || data.dps['21'] !== "colour") {
                    Logger.error("Invalid device of index " + (tuyaDevices.length - 1) + " found. Please check your config.json file.");
                    tuyaDevices[tuyaDevices.length - 1].disconnect();
                    tuyaDevices.splice(tuyaDevices.length - 1, 1);
                    return;
                }
                initialStates[tuyaDevices.length - 1].powered = data.dps['20'];
                initialStates[tuyaDevices.length - 1].color = data.dps['24'];
            });
            tuyaDevices[tuyaDevices.length - 1].on('disconnected', () => Logger.debug('Disconnected from device.'));
            tuyaDevices[tuyaDevices.length - 1].on('error', error => Logger.error("Device of ID " + device.id + " encountered an error: " + error));
        }
        Logger.info("Successfully loaded " + tuyaDevices.length + " device(s).");
    }
})();

// Handle SIGINT (Ctrl+C) gracefully and reset devices
process.on('SIGINT', async () => {
    Logger.warn("Process has been interrupted. Exiting...");
    for (let devId = 0; devId < tuyaDevices.length; devId++) {
        await tuyaDevices[devId].set({
            multiple: true,
            data: {
                '20': initialStates[devId].powered,
                '24': initialStates[devId].color,
            },
            shouldWaitForResponse: true
        });
        await tuyaDevices[devId].disconnect();
    }
    process.exit(0);
});