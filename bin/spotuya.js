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
import chalk from "chalk";

/*
    Config
 */
import Config from "./config.js";
import Logger from "./logger.js";
import Utils from "./utils.js";

import inquirer from "inquirer";
import Device, {DeviceType} from "./device.js";
import Playback from "./playback.js";
import PM2Provider from "./pm2provider.js";

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


const args = process.argv.slice(2);

let spotifyApi;
const tuyaDevices = [];
(async () => {
    Logger.initLogFile();

    const nonFlagArgs = args.filter(arg => !arg.startsWith("--"));
    const flagArgs = args.filter(arg => arg.startsWith("--"));

    if (nonFlagArgs.length === 0) return Logger.fatal("No arguments provided. Please run `spotuya help` for more information.");

    if (args.includes("--debug")) {
        Logger.setDebugMode(true);
        Logger.debug("Debug mode enabled.");
    }

    Config.loadConfigFromDisk();
    if ((Config.getConfigVersion() === undefined || Config.getConfigVersion() !== Utils.getVersion()) && !args.includes("shutup") && !args.includes("update")) Logger.warn("Your configuration file is outdated and may not work properly. Please run `spotuya update` to try and update the configuration or `spotuya shutup` to dismiss this message.");

    if (args.includes("setup") || args.includes("wizard")) {
        try {
            let fullSetup = false;
            if (!args.includes("--devices") && Config.getDevices().length === 0) return Logger.fatal("You can't run the setup without devices if you don't have any devices in your configuration file.");
            if (!args.includes("--spotify") && Config.getSpotifyConfig().accessToken === "") return Logger.fatal("You can't run the setup without Spotify if you don't have a Spotify access token in your configuration file.");
            if (!args.includes("--general") && Config.getRefreshRate() === undefined || Config.getStartOnBoot() === undefined) return Logger.fatal("You can't run the setup without general settings if you don't have a refresh rate or start on boot in your configuration file.");

            if (flagArgs.length === 0 || flagArgs.length === 1 && flagArgs.includes("--debug")) fullSetup = true;

            if (args.includes("--devices") || fullSetup) {
                const devices = await Cloud.wizard();
                devices.forEach(device => Config.addDevice(device));
                Logger.info("Successfully imported your devices!");
            }

            if (args.includes("--spotify") || fullSetup) {
                const spotifyConfig = Config.getSpotifyConfig();
                const answers = await inquirer.prompt(Utils.CREDENTIAL_QUESTIONS);
                spotifyConfig.clientId = answers.clientId;
                spotifyConfig.clientSecret = answers.clientSecret;
                Config.setSpotifyConfig(spotifyConfig);
                SpotifyAccessToken.setClientId(spotifyConfig.clientId);
                SpotifyAccessToken.setClientSecret(spotifyConfig.clientSecret);
                await SpotifyAccessToken.setup();
                let tokens = await SpotifyAccessToken.getAccessToken();
                spotifyConfig.accessToken = tokens.access_token;
                if (tokens.refresh_token) spotifyConfig.refreshToken = tokens.refresh_token;
                Config.setSpotifyConfig(spotifyConfig);
                Logger.info("Successfully saved your Spotify credentials!");
            }

            if (args.includes("--general") || fullSetup) {
                const answers = await inquirer.prompt(Utils.GENERAL_QUESTIONS);
                Config.setRefreshRate(answers.refreshRate);
                Config.setStartOnBoot(answers.startOnBoot === "y" || answers.startOnBoot === "yes");
                Logger.info("Successfully saved your general settings!");
            }

            Logger.info("Successfully set up your configuration file. You can now run `spotuya start` to start the program.");
        } catch (err) {
            Logger.fatal("Error while setting up... Make sure your details are correct and try again.");
        }
    } else if (args.includes("config")) {
        const action = nonFlagArgs[nonFlagArgs.indexOf("config") + 1];
        if (!action || (action !== "set" && action !== "get")) return Logger.fatal("Invalid action provided. Please use `set` or `get`.");
        if (action === "set") {
            const key = nonFlagArgs[nonFlagArgs.indexOf("config") + 2];
            const value = nonFlagArgs[nonFlagArgs.indexOf("config") + 3];
            if (!key || !value) return Logger.fatal("Invalid key or value provided. Please provide a key and value.");
            if (Config.getValue(key) === undefined) return Logger.fatal("Invalid key provided. Please provide a valid key.");
            Config.setValue(key, value);
            Logger.info("Successfully set " + key + " to " + value + ".");
        } else if (action === "get") {
            const key = nonFlagArgs[nonFlagArgs.indexOf("config") + 2];
            if (!key) return Logger.fatal("Invalid key provided. Please provide a key.");
            const value = Config.getValue(key);
            if (value === undefined) return Logger.fatal("Invalid key provided. Please provide a valid key.");
            Logger.info("Value of " + key + " is " + value + ".");
        }
    } else if (args.includes("list")) {
        Logger.info("Devices in your configuration file:");
        Config.getDevices().forEach((device, index) => {
            Logger.info("Device " + (index + 1) + ": ID " + device.id + " | Key " + device.key);
        });
    } else if (args.includes("update")) { // Added in 1.1.0
        Logger.info("Checking configuration...")
        if (Config.getConfigVersion() === Utils.getVersion()) return Logger.info("Your configuration is up to date.");
        else if (Config.getConfigVersion() === "1.0.1") {
            Logger.info("Updating configuration to v1.0.1...");
            Config.setConfigVersion(Utils.getVersion());
            Config.setStartOnBoot(false);
            Logger.info("Successfully updated configuration to v1.1.0.");
        } else Logger.info("Your configuration is outdated and may not work properly. Please run `spotuya setup --clean` to reset your configuration.");
    } else if (args.includes("shutup")) {
        if (Config.getConfigVersion() === Utils.getVersion()) return Logger.info("Config warning is already disabled.");
        Config.setConfigVersion(Utils.getVersion());
        Logger.info("Disabled the config warning.");
    } else if (args.includes("kill")) {
        Logger.debug("Killing all processes...");
        PM2Provider.killAllProcesses()
    } else if (args.includes("help")) {
        Utils.printHelpMessage();
    } else if (args.includes("version") || args.includes("ver") || args.includes("v")) {
        Utils.printVersion()
    } else if (args.includes("clean")) {
        Config.cleanConfig();
        Logger.info("Successfully cleaned the configuration file.");
    } else if (args.includes("start")) {
        if (Config.getDevices().length === 0) return Logger.fatal("No devices found! Make sure your configuration is correct. To set it up run `spotuya setup`.");

        Logger.info("Checking configuration...")
        const spotifyConfig = Config.getSpotifyConfig();

        if (Config.getDevices() === undefined || Config.getRefreshRate() === undefined || spotifyConfig === undefined || spotifyConfig.refreshToken === undefined || spotifyConfig.clientId === undefined || spotifyConfig.clientSecret === undefined) Logger.fatal("Invalid configuration file. Please run `spotuya setup --clean` to set up your config.json file.");
        if (Config.getRefreshRate() < 200) {
            Config.setRefreshRate(200);
            Logger.warn("Your refresh rate was too low and has been updated to 200ms.");
        }

        Logger.info("Checking Spotify credentials...");

        if (spotifyConfig.clientId === "" || spotifyConfig.clientSecret === "" || spotifyConfig.clientId === undefined || spotifyConfig.clientSecret === undefined) {
            const answers = await inquirer.prompt(Utils.CREDENTIAL_QUESTIONS);
            spotifyConfig.clientId = answers.clientId;
            spotifyConfig.clientSecret = answers.clientSecret;
            Config.setSpotifyConfig(spotifyConfig);
        }

        if (spotifyConfig.refreshToken.length > 5) SpotifyAccessToken.setRefreshToken(spotifyConfig.refreshToken);
        SpotifyAccessToken.setClientId(spotifyConfig.clientId);
        SpotifyAccessToken.setClientSecret(spotifyConfig.clientSecret);
        await SpotifyAccessToken.setup();
        let tokens = await SpotifyAccessToken.getAccessToken(spotifyConfig.clientId);
        spotifyConfig.accessToken = tokens.accessToken;
        if (tokens.refreshToken) spotifyConfig.refreshToken = tokens.refreshToken;
        Config.setSpotifyConfig(spotifyConfig);
        Logger.info("Successfully logged in to Spotify.");

        spotifyApi = new SpotifyWebApi({
            clientId: spotifyConfig.clientId,
            clientSecret: spotifyConfig.clientSecret,
            scope: 'user-read-currently-playing user-read-playback-state',
        });

        spotifyApi.setAccessToken(spotifyConfig.accessToken);

        Logger.info("Loading devices...");
        for (let device of Config.getDevices()) {
            if (device.id !== undefined && device.key !== undefined) {
                tuyaDevices.push(new Device(new TuyAPI({
                    id: device.id,
                    key: device.key,
                    issueGetOnConnect: true
                }), DeviceType.TYPE_B, Utils.DEFAULT_STATE));
            } else {
                Logger.error("Invalid device config! Skipping...");
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
                Logger.debug('Connected to device of type ' + tuyaDevices[id].getDeviceType() + ' with ID ' + tuyaDevices[id].getTuyaDevice().device.id + '.');
                setInterval(async () => {
                    try {
                        checkCurrentSong(id);
                    } catch (err) {
                        Logger.fatal("Something went wrong while checking the current song. Check your configuration file.");
                    }
                }, Config.getRefreshRate());
            });

            tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().on('data', data => {
                if (data.dps['20'] === undefined && tuyaDevices[tuyaDevices.length - 1].getDeviceType() === DeviceType.TYPE_B) tuyaDevices[tuyaDevices.length - 1].setDeviceType(DeviceType.TYPE_A);
                else if (data.dps['20'] === undefined) Logger.fatal("Invalid device of index " + (tuyaDevices.length - 1) + " found. Did Tuya implement a new device type?");

                if (data.dps === undefined || data.dps[tuyaDevices[tuyaDevices.length - 1].getStatusId()] === undefined) {
                    Logger.error("Invalid device of index " + (tuyaDevices.length - 1) + " found. Please check your configuration file.");
                    tuyaDevices[tuyaDevices.length - 1].getTuyaDevice().disconnect();
                    tuyaDevices.splice(tuyaDevices.length - 1, 1);
                    return;
                }

                let startState = {
                    powered: data.dps[tuyaDevices[tuyaDevices.length - 1].getStatusId()],
                    color: data.dps[tuyaDevices[tuyaDevices.length - 1].getColorId()]
                }

                tuyaDevices[tuyaDevices.length - 1].setDefaultState(startState);
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
            Playback.isPlaying = data.body.is_playing;
            if (Playback.isPlaying) {
                await Vibrant.from(data.body.item.album.images[0].url).getPalette(async (err, palette) => {
                    const rgb = palette.Vibrant.rgb;
                    const hex_value = Utils.rgbToHex(rgb, tuyaDevices[id].getDeviceType());
                    tuyaDevices[id].updateDevice(true, hex_value);
                })
            } else {
                tuyaDevices[id].resetDevice()
            }
        }, () => Logger.fatal("Something went wrong while checking the current song. Check your configuration file."));
}

// Handle SIGINT (Ctrl+C) gracefully and reset devices
process.on('SIGINT', async () => {
    Logger.warn("Process has been interrupted. Resetting all devices...");
    for (let devId = 0; devId < tuyaDevices.length; devId++) {
        await tuyaDevices[devId].resetDevice()
        await tuyaDevices[devId].getTuyaDevice().disconnect();
    }
    Logger.info("Successfully reset all devices. Exiting...");
    process.exit(0);
});

// Handle SIGTERM gracefully and reset devices
process.on('SIGTERM', async () => {
    Logger.warn("Process has been terminated. Resetting all devices...");
    for (let devId = 0; devId < tuyaDevices.length; devId++) {
        await tuyaDevices[devId].resetDevice()
        await tuyaDevices[devId].getTuyaDevice().disconnect();
    }
    Logger.info("Successfully reset all devices. Exiting...");
    process.exit(0);
});

// Handle uncaught exceptions and reset devices
process.on('uncaughtException', async (err) => {
    Logger.error("An uncaught exception occurred. Resetting all devices...");
    for (let devId = 0; devId < tuyaDevices.length; devId++) {
        await tuyaDevices[devId].resetDevice()
        await tuyaDevices[devId].getTuyaDevice().disconnect();
    }
    Logger.error("Successfully reset all devices. Exiting...");
    process.exit(1);
});