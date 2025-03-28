import chalk from "chalk";
import inquirer from "inquirer";
import Logger from "../utils/logger.js";
import Config from "../config/config.js";
import Utils from "../utils/utils.js";
import {PROVIDER_QUESTION, SPOTIFY_COLOR} from "../utils/constants.js";
import Cloud from "../services/cloud.js";
import {Command} from "../@types/types.js";

const upgrade: Command = {
    name: "upgrade",
    aliases: ["update"],
    description: "Upgrade the configuration to the latest version.",
    options: [],
    run: async (args: string[], options: Record<string, any>): Promise<void> => {
        Logger.info("Checking configuration...");
        if (Config.isUsingEnv()) {
            return Logger.error("You cannot upgrade the configuration when using environment variables. You need to upgrade the configuration manually.");
        }
        if (Config.getConfigVersion() === Utils.getVersion()) {
            return Logger.info("Your configuration is up to date.");
        }
        Logger.info(`Updating configuration to v${Utils.getVersion()}.`);
        const currentVersion = Config.getConfigVersion();
        await upgradeFromVersion(currentVersion);
        Config.setConfigVersion(Utils.getVersion());
        Logger.info(`Successfully updated configuration to v${Utils.getVersion()}.`);
        Config.saveConfig();
    }
}

async function upgradeFromVersion(version: string): Promise<void> {
    switch (version) {
        case "1.0.1":
            Config.setStartOnBoot(false);
        // Fall through to next version upgrades
        case "1.1.0":
            const {devices, userId, region, clientId, clientSecret} = await Cloud.wizard();
            Config.addDevices(devices);
            Config.setTuyaConfig({userId, region, clientId, clientSecret});
            Config.setPort(4815);
        // Fall through
        case "2.0.0":
            const paletteAnswers = await inquirer.prompt([
                {
                    name: 'colorPalette',
                    message: 'The color palette to use (-1: Cycle, 0: Vibrant, 1: DarkVibrant, 2: LightVibrant, 3: Muted, 4: DarkMuted, 5: LightMuted):',
                    prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
                },
                {
                    name: 'cycleRate',
                    message: 'The rate at which the color palette should cycle (in milliseconds):',
                    prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
                }
            ]);
            Config.setPaletteMode(paletteAnswers.colorPalette);
            Config.setPollRate(paletteAnswers.cycleRate);
        // Fall through
        case "2.0.1":
            const contrastAnswer = await inquirer.prompt([
                {
                    name: 'contrastOffset',
                    message: 'The contrast offset to apply to the color palette (between -100 and 100):',
                    prefix: chalk.hex(SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
                }
            ]);
            Config.setContrastOffset(contrastAnswer.contrastOffset);
        // Fall through
        case "2.1.0":
            Config.setOutdatedConfigWarning(false);
        // Fall through
        case "2.1.1":
            const dataProvider = (await inquirer.prompt(PROVIDER_QUESTION)).dataProvider;
            Config.setDataProvider(dataProvider);
        // Fall through
        case "2.2.0":
            Config.setPollRate(Config.getValue("refreshRate"));
            Config.setPollMode("dynamic");
            Config.setMaxPollInterval(20000);
            break;
        default:
            Logger.warn(`No known upgrade path for version ${version}.`);
            break;
    }
}

export default upgrade;