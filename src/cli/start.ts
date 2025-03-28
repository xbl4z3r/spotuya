import {Command} from "../@types/types.js";
import Logger from "../utils/logger.js";
import {SpotifyPlaybackStore} from "../store/spotify-playback-store.js";
import Config from "../config/config.js";
import {setupDevices, setupGeneral, setupSpotify} from "../core/prerequisites.js";
import {StateStore} from "../store/state-store.js";
import Palette from "../core/palette.js";
import Utils from "../utils/utils.js";
import Vibrant from "node-vibrant";
import {DeviceStore} from "../store/device-store.js";
import {SpotifyApiService} from "../services/spotify-api.js";

const start: Command = {
    name: "start",
    aliases: ["s", "run"],
    description: "Start the Spotuya service",
    options: [],
    run: async (args: string[], options: Record<string, any>) => {
        if (Config.getDevices().length === 0) {
            return Logger.fatal("No devices found! Make sure your configuration is correct. To set it up run `spotuya setup`.");
        }

        if (!(await setupGeneral())) return Logger.fatal("Failed to set up general configuration. Please check your configuration file.");
        if (Config.getDataProvider() === "spotify") if (!(await setupSpotify())) return Logger.fatal("Failed to set up Spotify configuration. Please check your configuration file.");

        SpotifyApiService.startPolling();

        const devices = await setupDevices();
        if (devices == null) return Logger.fatal("Failed to set up devices. Please check your configuration file.");
        DeviceStore.addDevices(devices);

        Logger.info(`Starting ${Config.getPollMode()} color sync with${Config.getPollMode() === "dynamic" ? " a base " : " "}poll rate of ${Config.getPollRate()}ms`);
        setInterval(async () => {
            if (!SpotifyPlaybackStore.getNowPlaying().is_playing) {
                Palette.destroy();
                await Utils.resetDevices(DeviceStore.getDevices());
                return;
            }
            if (!Palette.isCycling()) Palette.initialize();

            if (!StateStore.isEnabled()) {
                await Utils.resetDevices(DeviceStore.getDevices());
                return;
            }

            const imageUrl = SpotifyPlaybackStore.getNowPlaying().track.artUrl;
            if (!imageUrl) return;

            try {
                const palette: any = await new Promise((resolve, reject) => {
                    Vibrant.from(imageUrl).getPalette((err, result) => {
                        if (err || !result) reject(err || new Error("No palette generated"));
                        else resolve(result);
                    });
                });

                let rgb = [0, 0, 0];
                const paletteMode = Palette.getPaletteMode().toString();

                switch (paletteMode) {
                    case "0":
                        rgb = palette.Vibrant?.rgb || rgb;
                        break;
                    case "1":
                        rgb = palette.DarkVibrant?.rgb || rgb;
                        break;
                    case "2":
                        rgb = palette.LightVibrant?.rgb || rgb;
                        break;
                    case "3":
                        rgb = palette.Muted?.rgb || rgb;
                        break;
                    case "4":
                        rgb = palette.DarkMuted?.rgb || rgb;
                        break;
                    case "5":
                        rgb = palette.LightMuted?.rgb || rgb;
                        break;
                    default:
                        Logger.fatal(`Invalid palette mode ${paletteMode}. Please run 'spotuya help' for more information.`);
                        return;
                }

                for (const device of DeviceStore.getDevices()) {
                    device.setColor(Utils.rgbToHsv(rgb));
                }
            } catch (err) {
                Logger.error("Failed to generate palette:" + err);
                await Utils.resetDevices(DeviceStore.getDevices());
                return;
            }
        }, 1000); // Poll devices every second

        Logger.info("SpoTuya has started successfully!");
    }
}

export default start;