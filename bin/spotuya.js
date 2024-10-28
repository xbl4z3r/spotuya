#!/usr/bin/env node
import Vibrant from "node-vibrant";
import chalk from "chalk";
import inquirer from "inquirer";
import dotenv from "dotenv";
import Cloud from "./cloud.js";
import {SpotifyApiProvider, SpotifyPlaybackStore, SpotifyTokenStore} from "./spotify.js";
import Config from "./config.js";
import Logger from "./logger.js";
import Utils from "./utils.js";
import Device from "./device.js";
import PM2Provider from "./pm2provider.js";
import Upgrader from "./upgrader.js";
import PaletteProvider from "./palette.js";
import {StateController, WebserverProvider} from "./webserver.js";

dotenv.config();

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
console.log(chalk.white.bold("> Made with " + chalk.red("♥") + " by " + chalk.hex(Utils.SPOTIFY_COLOR)("xbl4z3r") + " | v" + Utils.getVersion() + " | Not affiliated with " + chalk.hex(Utils.SPOTIFY_COLOR)("Spotify®")) + " or " + chalk.hex(Utils.SPOTIFY_COLOR)("Tuya®"));

const args = process.argv.slice(2);
const nonFlagArgs = args.filter(arg => !arg.startsWith("--"));

const devices = [];

(async () => {
    Logger.initialize();

    if (nonFlagArgs.length === 0) return Logger.fatal("No arguments provided. Please run `spotuya help` for more information.");

    if (args.includes("--debug")) {
        Logger.setDebugMode(true);
        Logger.debug("Debug mode enabled.");
    }

    if ((process.env.USE_ENV || "").toUpperCase() === "TRUE") Config.enableEnv();

    Config.initialize();
    if (!Config.isUsingEnv() && (Config.getConfigVersion() === undefined || Config.getConfigVersion() !== Utils.getVersion()) && !args.includes("shutup") && !args.includes("upgrade")) Logger.warn("Your configuration file is outdated and may not work properly. Please run `spotuya upgrade` to try and update the configuration or `spotuya shutup` to dismiss this message.");

    if (args.includes("setup") || args.includes("wizard")) await Utils.handleSetup(args);
    else if (args.includes("config")) Config.handleConfigActions(args);
    else if (args.includes("list")) Utils.listDevices()
    else if (args.includes("upgrade")) await Upgrader.upgradeConfig();
    else if (args.includes("shutup")) Utils.disableConfigWarnings()
    else if (args.includes("kill")) PM2Provider.killAllProcesses()
    else if (args.includes("help")) Utils.printHelpMessage();
    else if (args.includes("version")
        || args.includes("ver")
        || args.includes("v")) Utils.printVersion()
    else if (args.includes("clean")) Config.cleanConfig();
    else if (args.includes("start")) {
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

        if (spotifyConfig.refreshToken.length > 5) SpotifyTokenStore.setRefreshToken(spotifyConfig.refreshToken);
        SpotifyTokenStore.setClientId(spotifyConfig.clientId);
        SpotifyTokenStore.setClientSecret(spotifyConfig.clientSecret);
        await WebserverProvider.initialize();
        let tokens = await SpotifyTokenStore.getAccessToken();
        spotifyConfig.accessToken = tokens.accessToken;
        if (tokens.refreshToken) spotifyConfig.refreshToken = tokens.refreshToken;
        Config.setSpotifyConfig(spotifyConfig);
        Logger.info("Successfully logged in to Spotify.");

        SpotifyApiProvider.initialize(spotifyConfig.clientId, spotifyConfig.clientSecret, spotifyConfig.accessToken);

        Logger.info("Loading devices...");
        if (Config.getDevices().length === 0) Logger.fatal("No devices found! Make sure your configuration is correct. To set it up run `spotuya setup`.");

        await Cloud.initialize(Config.getTuyaConfig());
        await PaletteProvider.initialize();

        const configDevices = Config.getDevices();
        for (let i = 0; i < configDevices.length; i++) {
            const device = new Device(configDevices[i]);
            await device.initialize();
            Logger.info(`Successfully loaded device ${device.name} (${device.id}).`);

            device.setInterval(
                setInterval(async () => {
                    if (StateController.isEnabled() === false) {
                        await device.resetDevice();
                        return;
                    }

                    try {
                        const data = await SpotifyApiProvider.getApi().getMyCurrentPlaybackState();

                        if (data.body.currently_playing_type !== "track") {
                            await device.resetDevice();
                            await PaletteProvider.destroy();
                            return;
                        }

                        SpotifyPlaybackStore.setPlaying(data.body.is_playing);
                        SpotifyPlaybackStore.setSongName(data.body.item.name);
                        SpotifyPlaybackStore.setArtistName(data.body.item.artists[0].name);
                        SpotifyPlaybackStore.setAlbumName(data.body.item.album.name);
                        SpotifyPlaybackStore.setImageUrl(data.body.item.album.images[0].url);
                        SpotifyPlaybackStore.setProgress(data.body.progress_ms / data.body.item.duration_ms * 100);

                        if (SpotifyPlaybackStore.getPlaying()) {
                            if (!PaletteProvider.isCycling()) PaletteProvider.initialize();
                            await Vibrant.from(data.body.item.album.images[0].url).getPalette(async (err, palette) => {
                                let rgb;
                                switch (PaletteProvider.getPaletteMode().toString()) {
                                    case "0":
                                        rgb = palette.Vibrant.rgb;
                                        break;
                                    case "1":
                                        rgb = palette.DarkVibrant.rgb;
                                        break;
                                    case "2":
                                        rgb = palette.LightVibrant.rgb;
                                        break;
                                    case "3":
                                        rgb = palette.Muted.rgb;
                                        break;
                                    case "4":
                                        rgb = palette.DarkMuted.rgb;
                                        break;
                                    case "5":
                                        rgb = palette.LightMuted.rgb;
                                        break;
                                    default:
                                        Logger.fatal(`Invalid palette mode ${PaletteProvider.getPaletteMode()}. Please run 'spotuya help' for more information.`);
                                        break;
                                }
                                device.setColor(Utils.rgbToHsv(rgb));
                            })
                        } else {
                            await device.resetDevice()
                            await PaletteProvider.destroy();
                        }
                    } catch (err) {

                        if (!err.message.includes("WebapiRegularError")) {
                            Logger.error("An error occurred while updating the device.");
                            Logger.error(err);
                            return;
                        }
                        const tokens = await SpotifyTokenStore.getAccessToken();
                        spotifyConfig.accessToken = tokens.accessToken;
                        if (tokens.refreshToken) spotifyConfig.refreshToken = tokens.refreshToken;
                        Config.setSpotifyConfig(spotifyConfig);
                    }
                }, Config.getRefreshRate())
            );

            devices.push(device);
        }
        Logger.info("Successfully loaded " + devices.length + " device(s).");
    } else Logger.fatal("Invalid arguments provided. Please run `spotuya help` for more information.");
})();

// Handle SIGINT (Ctrl+C) gracefully and reset devices
process.on('SIGINT', async () => {
    Logger.warn("Process has been interrupted. Resetting all devices...");
    for (const device of devices) {
        await device.resetDevice();
        await device.destroy();
    }
    Logger.info("Successfully reset all devices. Exiting...");
    process.exit(0);
});

// Handle SIGTERM gracefully and reset devices
process.on('SIGTERM', async () => {
    Logger.warn("Process has been terminated. Resetting all devices...");
    for (const device of devices) {
        await device.resetDevice();
        await device.destroy();
    }
    Logger.info("Successfully reset all devices. Exiting...");
    process.exit(0);
});

// Handle uncaught exceptions and reset devices
process.on('uncaughtException', async (err) => {
    Logger.error("An uncaught exception occurred. Resetting all devices...");
    Logger.error(err.message);
    Logger.error(err.stack);
    for (const device of devices) {
        await device.resetDevice();
        await device.destroy();
    }
    Logger.error("Successfully reset all devices. Exiting...");
    process.exit(1);
});