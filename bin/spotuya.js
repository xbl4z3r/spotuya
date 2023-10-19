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

import inquirer from "inquirer";
import Device, {DeviceType} from "./device.js";

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
console.log(chalk.white.bold("> Made with " + chalk.red("♥") + " by " + chalk.hex(Utils.SPOTIFY_COLOR)("xbl4z3r") + " | v" + Utils.getVersion() + " | Not affiliated with " + chalk.hex(Utils.SPOTIFY_COLOR)("Spotify®")));

const DEFAULT_STATE = {
    powered: false,
    color: "010403200302"
}

const args = process.argv.slice(2);

const setState = [];
let spotifyApi;
let isPlaying = false;
const tuyaDevices = [];
(async () => {
    if (args.includes("--debug")) Logger.setDebugMode(true);
    const config = Config.getConfigFromDisk(args.includes("--clean"));

    if ((config.configVersion === undefined || config.configVersion !== Utils.getVersion()) && !args.includes("shutup")) Logger.warn("Your config.json file is outdated and may not work properly. Please run `spotuya setup --clean` to set up your config.json file or `spotuya shutup` to dismiss this message.");

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

            const spotifyConfig = config.spotify;

            if (spotifyConfig.accessToken === "") {
                Logger.debug("No Spotify access token found. Prompting user to log in...");
                if (config.clientId === "" || config.clientSecret === "") {
                    const answers = await inquirer.prompt(Utils.CREDENTIAL_QUESTIONS);
                    spotifyConfig.clientId = answers.clientId;
                    spotifyConfig.clientSecret = answers.clientSecret;
                    config.spotify = spotifyConfig;
                    console.log(SpotifyAccessToken.CLIENT_SECRET)
                    Config.saveConfig(config);
                }
                if (spotifyConfig.refreshToken > 5) SpotifyAccessToken.setRefreshToken(spotifyConfig.refreshToken);
                SpotifyAccessToken.setClientId(spotifyConfig.clientId);
                SpotifyAccessToken.setClientSecret(spotifyConfig.clientSecret);
                await SpotifyAccessToken.setup();
                let tokens = await SpotifyAccessToken.getAccessToken();
                spotifyConfig.accessToken = tokens.access_token;
                if (tokens.refresh_token) spotifyConfig.refreshToken = tokens.refresh_token;
                config.spotify = spotifyConfig;
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
        Logger.info("Running SpoTuya v" + Utils.getVersion() + " by xbl4z3r.");
    } else if (args.includes("shutup")) {
        config.configVersion = Utils.getVersion();
        Config.saveConfig(config);
        Logger.info("Disabled the config warning.");
    } else if (args.includes("start")) {

        Logger.info("Checking config...")
        const spotifyConfig = config.spotify;

        if (config.devices === undefined || config.refreshRate === undefined || spotifyConfig === undefined || spotifyConfig.refreshToken === undefined || spotifyConfig.clientId === undefined || spotifyConfig.clientSecret === undefined) Logger.fatal("Invalid config.json file. Please run `spotuya setup --clean` to set up your config.json file.");
        if (config.refreshRate < 200) {
            config.refreshRate = 200;
            Config.saveConfig(config);
            Logger.warn("Your refresh rate was too low and has been updated to 200ms.");
        }

        Logger.info("Checking Spotify access token...");

        if (spotifyConfig.accessToken === "" || spotifyConfig.accessToken === undefined) {
            Logger.warn("No Spotify access token found. Prompting user to log in...");
            if (config.clientId === "" || config.clientSecret === "") {
                const answers = await inquirer.prompt(Utils.CREDENTIAL_QUESTIONS);
                spotifyConfig.clientId = answers.clientId;
                spotifyConfig.clientSecret = answers.clientSecret;
                config.spotify = spotifyConfig;
                Config.saveConfig(config);
            }
            if (spotifyConfig.refreshToken > 5) SpotifyAccessToken.setRefreshToken(spotifyConfig.refreshToken);
            SpotifyAccessToken.setClientId(spotifyConfig.clientId);
            SpotifyAccessToken.setClientSecret(spotifyConfig.clientSecret);
            await SpotifyAccessToken.setup();
            let tokens = await SpotifyAccessToken.getAccessToken(spotifyConfig.clientId);
            spotifyConfig.accessToken = tokens.accessToken;
            if (tokens.refreshToken) spotifyConfig.refreshToken = tokens.refreshToken;
            config.spotify = spotifyConfig;
            Config.saveConfig(config);
            Logger.info("Successfully saved access token to config.json file.");
        }

        spotifyApi = new SpotifyWebApi({
            clientId: spotifyConfig.clientId,
            clientSecret: spotifyConfig.clientSecret,
            scope: 'user-read-currently-playing user-read-playback-state',
        });

        spotifyApi.setAccessToken(spotifyConfig.accessToken);

        Logger.info("Loading devices...");
        for (let device of config.devices) {
            if (device.id !== undefined && device.key !== undefined) {
                tuyaDevices.push(new Device(new TuyAPI({
                    id: device.id,
                    key: device.key,
                    issueGetOnConnect: true
                }), DeviceType.TYPE_B, DEFAULT_STATE));
                setState.push(false);
            } else {
                Logger.error("Invalid device config");
                continue;
            }

            // Find device on network
            tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().find().then(() => {
                // Connect to device
                tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().connect();
            });

            // Add event listeners
            tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().on('connected', async () => {
                let id = tuyaDevices.length - 1;
                Logger.debug('Connected to device.');
                setInterval(async () => {
                    try {
                        checkCurrentSong(id);
                    } catch (err) {
                        Logger.fatal("Something went wrong while checking the current song. Check your config.json file.");
                    }
                }, refreshRate);
            });

            tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().on('data', data => {
                if (data.dps['20'] === undefined && tuyaDevices[tuyaDevices.length - 1].getDeviceType() === DeviceType.TYPE_B) tuyaDevices[tuyaDevices.length - 1].setDeviceType(DeviceType.TYPE_A);
                else if (data.dps['20'] === undefined) Logger.fatal("Invalid device of index " + (tuyaDevices.length - 1) + " found. Did Tuya implement a new device type?");

                if (data.dps === undefined || data.dps[tuyaDevices[tuyaDevices.length - 1].getStatusId()] === undefined) {
                    Logger.error("Invalid device of index " + (tuyaDevices.length - 1) + " found. Please check your config.json file.");
                    tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().disconnect();
                    tuyaDevices.splice(tuyaDevices.length - 1, 1);
                    return;
                }

                let defaultState = {
                    powered: data.dps[tuyaDevices[tuyaDevices.length - 1].getStatusId()],
                    color: data.dps[tuyaDevices[tuyaDevices.length - 1].getColorId()]
                }

                tuyaDevices[tuyaDevices.length - 1].setDefaultState(defaultState);
            });

            tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().on('disconnected', () => Logger.debug('Disconnected from device.'));
            tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().on('error', error => Logger.error("Device of ID " + device.id + " encountered an error: " + error));
        }
        Logger.info("Successfully loaded " + tuyaDevices.length + " device(s).");
    }
})();

const checkCurrentSong = function (id) {
    spotifyApi.getMyCurrentPlaybackState()
        .then(async function (data) {
            if (data.body.is_playing) {
                isPlaying = true;
                setState[id] = false;
                await Vibrant.from(data.body.item.album.images[0].url).getPalette(async (err, palette) => {
                    const rgb = palette.Vibrant.rgb;
                    const hsv = convert.rgb.hsv(rgb[0], rgb[1], rgb[2]);
                    const hex_value = Utils.hsvToHex(hsv[0] / 360, hsv[1] / 100, hsv[2] / 100);

                    tuyaDevices[id].updateDevice(true, hex_value);
                })
            } else {
                isPlaying = false;
                if (!setState[id]) {
                    setState[id] = true;
                    tuyaDevices[id].resetDevice()
                }
            }
        }, () => Logger.fatal("Something went wrong while checking the current song. Check your config.json file."));
}

// Handle SIGINT (Ctrl+C) gracefully and reset devices
process.on('SIGINT', async () => {
    Logger.warn("Process has been interrupted. Exiting...");
    for (let devId = 0; devId < tuyaDevices.length; devId++) {
        await tuyaDevices[devId].resetDevice()
        await tuyaDevices[devId].getTuyaDevice().disconnect();
    }
    process.exit(0);
});