import {Command} from "../@types/types.js";
import Config from "../config/config.js";
import Logger from "../utils/logger.js";
import inquirer from "inquirer";
import {CREDENTIAL_QUESTIONS, GENERAL_QUESTIONS} from "../utils/constants.js";
import {SpotifyTokenStore} from "../store/spotify-token-store.js";
import {Webserver} from "../services/webserver.js";
import Cloud from "../services/cloud.js";

const setup: Command = {
    name: "setup",
    aliases: ["wizard"],
    description: "Run the setup wizard to configure SpoTuya.",
    options: [
        {
            name: "devices",
            description: "Set up your Tuya devices.",
            type: "boolean",
        },
        {
            name: "spotify",
            description: "Set up your Spotify credentials.",
            type: "boolean",
        },
        {
            name: "spotuya",
            description: "Set up your SpoTuya configuration.",
            type: "boolean",
        }
    ],
    run: async (args: string[], options: Record<string, any>): Promise<void> => {
        try {
            let fullSetup = false;
            if (options.length === 0 || (Object.keys(options).length === 1 && Object.keys(options).includes("debug"))) fullSetup = true;
            if (!options.devices && Config.getDevices().length === 0 && !fullSetup) return Logger.fatal("You can't run the setup without devices if you don't have any devices in your configuration file.");
            if (!options.spotify && Config.getSpotifyConfig().accessToken === "" && !fullSetup) return Logger.fatal("You can't run the setup without Spotify if you don't have a Spotify access token in your configuration file.");
            if ((!options.spotuya && Config.getRefreshRate() === undefined || Config.getStartOnBoot() === undefined) && !fullSetup) return Logger.fatal("You can't run the setup without SpoTuya settings if you don't have a refresh rate or start on boot in your configuration file.");

            if (options.devices || fullSetup) {
                const {devices, userId, region, clientId, clientSecret} = await Cloud.wizard();
                Config.addDevices(devices);
                Config.setTuyaConfig({userId, region, clientId, clientSecret});
                Logger.info("Successfully imported your devices!");
            }

            if (options.spotify || fullSetup) {
                const spotifyConfig = Config.getSpotifyConfig();
                const answers = await inquirer.prompt(CREDENTIAL_QUESTIONS);
                spotifyConfig.clientId = answers.clientId;
                spotifyConfig.clientSecret = answers.clientSecret;
                Config.setSpotifyConfig(spotifyConfig);
                SpotifyTokenStore.setClientId(spotifyConfig.clientId);
                SpotifyTokenStore.setClientSecret(spotifyConfig.clientSecret);
                await Webserver.initialize();
                let tokens = await SpotifyTokenStore.getAccessToken();
                spotifyConfig.accessToken = tokens.access_token;
                if (tokens.refresh_token) spotifyConfig.refreshToken = tokens.refresh_token;
                Config.setSpotifyConfig(spotifyConfig);
                Logger.info("Successfully saved your Spotify credentials!");
            }

            if (options.spotuya || fullSetup) {
                const answers = await inquirer.prompt(GENERAL_QUESTIONS);
                Config.setRefreshRate(answers.refreshRate);
                Config.setStartOnBoot(answers.startOnBoot === "y" || answers.startOnBoot === "yes");
                Config.setPort(answers.port);
                Config.setPaletteMode(answers.colorPalette);
                Config.setCycleRate(answers.cycleRate);
                Config.setContrastOffset(answers.contrastOffset);
                Logger.info("Successfully saved your SpoTuya settings!");
            }

            Config.saveConfig();
            Logger.info("Successfully set up your configuration file. You can now run `spotuya start` to start the program.");

            setTimeout(() => {
                process.exit(0);
            }, 500);
        } catch (error) {
            Logger.error(`Setup failed: ${error instanceof Error ? error.message : String(error)}`);
            process.exit(1);
        }
    }
}

export default setup;