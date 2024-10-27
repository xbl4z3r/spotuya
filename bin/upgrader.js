import Logger from "./logger.js";
import Config from "./config.js";
import Utils from "./utils.js";
import Cloud from "./cloud.js";

export default class Upgrader {
    static upgradeConfig = async () => {
        Logger.info("Checking configuration...");
        if (Config.getConfigVersion() === Utils.getVersion()) return Logger.info("Your configuration is up to date.");
        else if (Config.getConfigVersion() === "1.0.1") {
            Logger.info("Updating configuration to v" + Utils.getVersion() + ".");
            Config.setStartOnBoot(false);
            const { devices, userId, region, clientId, clientSecret } = await Cloud.wizard();
            Config.addDevices(devices);
            Config.setTuyaConfig({userId, region, clientId, clientSecret});
            Config.setConfigVersion(Utils.getVersion());
            Logger.info("Successfully updated configuration to v" + Utils.getVersion() + ".");
        } else if (Config.getConfigVersion() === "1.1.0") {
            Logger.info("Updating configuration to v" + Utils.getVersion() + ".");
            const { devices, userId, region, clientId, clientSecret } = await Cloud.wizard();
            Config.addDevices(devices);
            Config.setTuyaConfig({userId, region, clientId, clientSecret});
            Logger.info("Successfully updated configuration to v" + Utils.getVersion() + ".");
        } else Logger.info("Your configuration is outdated and may not work properly. Please run `spotuya setup --clean` to reset your configuration.");
        Config.saveConfig();
    }
}