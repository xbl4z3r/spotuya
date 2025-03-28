import Utils from "../utils/utils.js";
import Logger from "../utils/logger.js";

const version = {
    name: "version",
    aliases: ["v", "ver"],
    description: "Shows the current version of SpoTuya.",
    options: [],
    run: async (args: string[], options: Record<string, any>) => {
        Logger.info("Running SpoTuya v" + Utils.getVersion() + " by xbl4z3r.");
        Logger.info("  - Not affiliated with Spotify® or Tuya®.");
        Logger.info("  - GitHub: https://github.com/xbl4z3r/spotuya");
    }
}

export default version;