import Config from "../config/config.js";
import Logger from "../utils/logger.js";

const shutup = {
    name: "shutup",
    description: "Disable the outdated config warning.",
    options: [],
    run: async () => {
        if (!Config.getOutdatedConfigWarning()) return Logger.info("Config warning is already disabled.");
        Config.setOutdatedConfigWarning(false);
        Logger.info("Disabled the config warning.");
    }
}

export default shutup;