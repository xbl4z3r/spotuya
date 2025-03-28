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

async function setupGeneral(): Promise<boolean> {
    Logger.info("Checking configuration...");
    if (Config.getPollRate() < 1000) {
        Config.setPollRate(1000);
        Logger.warn("Your refresh rate was too low and has been updated to 1000ms.");
    } else Logger.debug("Refresh rate is set to " + Config.getPollRate() + "ms.");

    if (Config.getPollMode() !== "dynamic" && Config.getPollMode() !== "static") {
        Config.setPollMode("dynamic");
        Logger.warn("Your poll mode was not set. It has been updated to dynamic.");
    }

    if (Config.getStartOnBoot() === undefined) {
        Config.setStartOnBoot(false);
        Logger.warn("Your start on boot setting was not set. It has been updated to false.");
    } else Logger.debug("Start on boot is set to " + Config.getStartOnBoot() + ".");

    if (Config.getPaletteMode() === undefined) {
        Config.setPaletteMode(0);
        Logger.warn("Your palette mode was not set. It has been updated to 0.");
    } else Logger.debug("Palette mode is set to " + Config.getPaletteMode() + ".");

    if (Config.getContrastOffset() === undefined) {
        Config.setContrastOffset(0);
        Logger.warn("Your contrast offset was not set. It has been updated to 0.");
    } else Logger.debug("Contrast offset is set to " + Config.getContrastOffset() + ".");

    if (Config.getDataProvider() === undefined) {
        Config.setDataProvider("spotify");
        Logger.warn("Your data provider was not set. It has been updated to Spotify.");
    } else Logger.debug("Data provider is set to " + Config.getDataProvider() + ".");

    if (Config.getDataProvider() !== "spotify") {
        Logger.debug("Checking custom data provider: " + Config.getDataProvider());
        try {
            new URL(Config.getDataProvider());
            Logger.debug("Custom data provider is a valid URL.");
        } catch (e) {
            Logger.fatal("Your data provider is not a valid URL. Please run `spotuya setup` to fix this.");
            return false;
        }
    }

    return true;
}

async function setupSpotify(): Promise<boolean> {
    Logger.info("Checking Spotify credentials...");
    try {
        const spotifyConfig = Config.getSpotifyConfig();

        if (spotifyConfig.clientId === "" || spotifyConfig.clientSecret === "" ||
            spotifyConfig.clientId === undefined || spotifyConfig.clientSecret === undefined) {
            Logger.warn("Your Spotify credentials are not set. Asking for them now.");
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
        SpotifyApiService.initialize(spotifyConfig.clientId, spotifyConfig.clientSecret, spotifyConfig.accessToken, Config.getPollRate());

        return true;
    } catch (error) {
        Logger.fatal("Failed to log in to Spotify. Please check your credentials and try again.");
        Logger.debug(error);
        return false;
    }
}

async function setupDevices(): Promise<Device[] | null> {
    Logger.info("Loading devices...");
    if (Config.getDevices().length === 0) {
        Logger.fatal("No devices found! Make sure your configuration is correct. To set it up run `spotuya setup`.");
        return null;
    }

    try {
        await Cloud.initialize(Config.getTuyaConfig());
        Palette.initialize();

        const devices: Device[] = [];

        const configDevices = Config.getDevices();
        for (let i = 0; i < configDevices.length; i++) {
            try {
                const device = new Device(configDevices[i]);
                await device.initialize();
                Logger.info(`Successfully loaded device ${device.name} (${device.id}).`);
                devices.push(device);
            } catch (error) {
                Logger.error(`Failed to load device ${configDevices[i].name} (${configDevices[i].id}).`);
                Logger.debug(error);
            }
        }

        Logger.info("Successfully loaded " + devices.length + "/" + configDevices.length + " device" + (devices.length === 1 ? "" : "s") + ".");
        return devices;
    } catch (error) {
        Logger.fatal("Failed to load devices. Please check your configuration and try again.");
        Logger.debug(error);
        return null;
    }
}

export {setupApplication, setupGeneral, setupSpotify, setupDevices};