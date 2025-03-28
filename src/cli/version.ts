import Utils from "../utils/utils.js";

const version = {
    name: "version",
    aliases: ["v", "ver"],
    description: "Shows the current version of SpoTuya.",
    options: [],
    run: async (args: string[], options: Record<string, any>) => {
        Utils.printVersion();
    }
}

export default version;