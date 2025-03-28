import Config from "../config/config.js";
import Logger from "../utils/logger.js";

const shutup = {
    name: "shutup",
    aliases: ["shut", "mute"],
    description: "Disable the outdated config warning.",
    options: [],
    run: async (args: string[], options: Record<string, any>) => {
        if (!Config.getOutdatedConfigWarning()) return Logger.info("Config warning is already disabled.");
        Config.setOutdatedConfigWarning(false);
        Logger.info("Disabled the config warning.");
    }
}

export default shutup;