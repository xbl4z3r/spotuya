import Logger from "./logger.js";
import Config from "./config.js";
import Utils from "./utils.js";
import Cloud from "./cloud.js";
import inquirer from "inquirer";
import chalk from "chalk";

export default class Upgrader {
    static upgradeConfig = async () => {
        Logger.info("Checking configuration...");
        if (Config.getConfigVersion() === Utils.getVersion()) return Logger.info("Your configuration is up to date.");
        Logger.info("Updating configuration to v" + Utils.getVersion() + ".");
        switch (Config.getConfigVersion()) {
            case "1.0.1":
                Config.setStartOnBoot(false);
            case "1.1.0":
                const {devices, userId, region, clientId, clientSecret} = await Cloud.wizard();
                Config.addDevices(devices);
                Config.setTuyaConfig({userId, region, clientId, clientSecret});
                Config.setPort(4815);
            case "2.0.0":
                const answers = await inquirer.prompt([
                    {
                        name: 'colorPalette',
                        message: 'The color palette to use (-1: Cycle, 0: Vibrant, 1: DarkVibrant, 2: LightVibrant, 3: Muted, 4: DarkMuted, 5: LightMuted):',
                        prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
                    },
                    {
                        name: 'cycleRate',
                        message: 'The rate at which the color palette should cycle (in milliseconds):',
                        prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
                    }
                ]);
                Config.setPaletteMode(answers.colorPalette);
                Config.setRefreshRate(answers.cycleRate);
        }
        Config.setConfigVersion(Utils.getVersion());
        Logger.info("Successfully updated configuration to v" + Utils.getVersion() + ".");
        Config.saveConfig();
    }
}