#!/usr/bin/env node
import Logger from "./utils/logger.js";
import dotenv from "dotenv";
import chalk from "chalk";
import {SPOTIFY_COLOR} from "./utils/constants.js";
import Utils from "./utils/utils.js";
import {setupApplication} from "./core/prerequisites.js";
import CommandHandler from "./core/command-handler.js";
import {DeviceStore} from "./store/device-store.js";

dotenv.config();

const args = process.argv.slice(2);
const nonFlagArgs = args.filter(arg => !arg.startsWith("--"));

function printBanner() {
    console.log(chalk.hex(SPOTIFY_COLOR).bold(" .oooooo..o                      ooooooooooooo                                   \n" +
        "d8P'    `Y8                      8'   888   `8                                   \n" +
        "Y88bo.      oo.ooooo.   .ooooo.       888      oooo  oooo  oooo    ooo  .oooo.   \n" +
        " `\"Y8888o.   888' `88b d88' `88b      888      `888  `888   `88.  .8'  `P  )88b  \n" +
        "     `\"Y88b  888   888 888   888      888       888   888    `88..8'    .oP\"888  \n" +
        "oo     .d8P  888   888 888   888      888       888   888     `888'    d8(  888  \n" +
        "8\"\"88888P'   888bod8P' `Y8bod8P'     o888o      `V88V\"V8P'     .8'     `Y888\"\"8o \n" +
        "             888                                           .o..P'                \n" +
        "            o888o                                          `Y8P'                 \n" +
        "                                                                                 "));
    console.log(chalk.white.bold("> Made with " + chalk.red("♥") + " by " + chalk.hex(SPOTIFY_COLOR)("xbl4z3r") + " | v" + Utils.getVersion() + " | Not affiliated with " + chalk.hex(SPOTIFY_COLOR)("Spotify®")) + " or " + chalk.hex(SPOTIFY_COLOR)("Tuya®"));
}

async function main() {
    printBanner();
    if (nonFlagArgs.length === 0) {
        return Logger.fatal("No arguments provided. Please run `spotuya help` for more information.");
    }
    await setupApplication(args);
    await CommandHandler.executeCommand(args);
}

main().catch(err => {
    Logger.error("An error occurred in the main process:");
    Logger.error(err.message);
    Logger.error(err.stack);
    process.exit(1);
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
    Logger.warn("Process has been interrupted. Resetting all devices...");
    await Utils.resetDevices(DeviceStore.getDevices());
    Logger.info("Successfully reset all devices. Exiting...");
    process.exit(0);
});

// Handle SIGTERM
process.on('SIGTERM', async () => {
    Logger.warn("Process has been terminated. Resetting all devices...");
    await Utils.resetDevices(DeviceStore.getDevices());
    Logger.info("Successfully reset all devices. Exiting...");
    process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', async (err) => {
    Logger.error("An uncaught exception occurred. Resetting all devices...");
    Logger.error(err.message);
    Logger.error(err.stack);
    await Utils.resetDevices(DeviceStore.getDevices());
    Logger.error("Successfully reset all devices. Exiting...");
    process.exit(1);
});