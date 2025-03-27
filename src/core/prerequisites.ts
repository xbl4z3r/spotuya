import Logger from "../utils/logger.js";
import Config from "../config/config.js";
import inquirer from "inquirer";
import {CREDENTIAL_QUESTIONS} from "../utils/constants.js";
import {SpotifyTokenStore} from "../store/spotify-token-store.js";
import {Webserver} from "../services/webserver.js";
import {SpotifyApiService} from "../services/spotify-api.js";
import Cloud from "../services/cloud.js";
import Palette from "./palette.js";
import Device from "./device.js";
import Utils from "../utils/utils.js";
import CommandHandler from "./command-handler.js";

async function setupApplication(args: string[]) {
    Logger.initialize();

    if (args.includes("--debug")) {
        Logger.setDebugMode(true);
        Logger.debug("Debug mode enabled.");
    }

    Logger.debug("Running pre-flight checks...");

    if ((process.env.USE_ENV || "").toUpperCase() === "TRUE") {
        Config.enableEnv();
        Logger.debug("Using environment variables for configuration.");
    }

    Logger.debug("Initializing configuration...");
    Config.initialize();
    if (!Config.isUsingEnv() &&
        (Config.getConfigVersion() === undefined || Config.getConfigVersion() !== Utils.getVersion()) &&
        Config.getOutdatedConfigWarning() &&
        !args.includes("shutup") &&
        !args.includes("upgrade")) {
        Logger.warn("Your configuration file is outdated and may not work properly. Please run `spotuya upgrade` to try and update the configuration or `spotuya shutup` to dismiss this message.");
    }

    await CommandHandler.loadCommands();
}

async function setupSpotify() {
    Logger.info("Checking Spotify credentials...");
    const spotifyConfig = Config.getSpotifyConfig();

    if (spotifyConfig.clientId === "" || spotifyConfig.clientSecret === "" ||
        spotifyConfig.clientId === undefined || spotifyConfig.clientSecret === undefined) {
        const answers = await inquirer.prompt(CREDENTIAL_QUESTIONS);
        spotifyConfig.clientId = answers.clientId;
        spotifyConfig.clientSecret = answers.clientSecret;
        Config.setSpotifyConfig(spotifyConfig);
    }

    if (spotifyConfig.refreshToken.length > 5) {
        SpotifyTokenStore.setRefreshToken(spotifyConfig.refreshToken);
    }

    SpotifyTokenStore.setClientId(spotifyConfig.clientId);
    SpotifyTokenStore.setClientSecret(spotifyConfig.clientSecret);
    await Webserver.initialize();

    const tokens = await SpotifyTokenStore.getAccessToken();
    spotifyConfig.accessToken = tokens.access_token;
    if (tokens.refresh_token) spotifyConfig.refreshToken = tokens.refresh_token;
    Config.setSpotifyConfig(spotifyConfig);

    Logger.info("Successfully logged in to Spotify.");
    SpotifyApiService.initialize(spotifyConfig.clientId, spotifyConfig.clientSecret, spotifyConfig.accessToken);
}

async function setupDevices() {
    Logger.info("Loading devices...");
    if (Config.getDevices().length === 0) {
        Logger.fatal("No devices found! Make sure your configuration is correct. To set it up run `spotuya setup`.");
    }

    await Cloud.initialize(Config.getTuyaConfig());
    Palette.initialize();

    const devices = [];

    const configDevices = Config.getDevices();
    for (let i = 0; i < configDevices.length; i++) {
        const device = new Device(configDevices[i]);
        await device.initialize();
        Logger.info(`Successfully loaded device ${device.name} (${device.id}).`);
        devices.push(device);
    }

    Logger.info("Successfully loaded " + devices.length + " device(s).");
    return devices;
}

export { setupApplication, setupSpotify, setupDevices };