import Utils from "../utils/utils.js";

const version = {
    name: "version",
    description: "Shows the current version of SpoTuya.",
    options: [],
    run: async () => {
        Utils.printVersion();
    }
}

export default version;