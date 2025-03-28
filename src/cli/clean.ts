import Config from "../config/config.js";
import {Command} from "../@types/types.js";

const clean: Command = {
    name: "clean",
    description: "Clean the configuration.",
    options: [],
    run: async (args: string[], options: Record<string, any>) => {
        Config.cleanConfig();
    }
}

export default clean;