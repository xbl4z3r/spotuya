import {Command} from "../../@types/types.js";
import Logger from "../utils/logger.js";
import {SpotifyPlaybackStore} from "../store/spotify-playback-store.js";
import Config from "../config/config.js";
import {setupDevices, setupSpotify} from "../core/prerequisites.js";
import {StateStore} from "../store/state-store.js";
import Palette from "../core/palette.js";
import Utils from "../utils/utils.js";
import Vibrant from "node-vibrant";
import {DeviceStore} from "../store/device-store.js";

const start: Command = {
    name: 'start',
    description: 'Start the Spotuya service',
    options: [],
    run: async () => {
        if (Config.getDevices().length === 0) {
            return Logger.fatal("No devices found! Make sure your configuration is correct. To set it up run `spotuya setup`.");
        }

        Logger.info("Checking configuration...")
        const spotifyConfig = Config.getSpotifyConfig();

        if (Config.getDevices() === undefined ||
            Config.getRefreshRate() === undefined ||
            spotifyConfig === undefined ||
            spotifyConfig.refreshToken === undefined ||
            spotifyConfig.clientId === undefined ||
            spotifyConfig.clientSecret === undefined) {
            Logger.fatal("Invalid configuration file. Please run `spotuya setup --clean` to set up your config.json file.");
        }

        if (Config.getRefreshRate() < 1000) {
            Config.setRefreshRate(1000);
            Logger.warn("Your refresh rate was too low and has been updated to 200ms.");
        }

        await setupSpotify();

        SpotifyPlaybackStore.startPolling(Config.getRefreshRate());

        DeviceStore.addDevices(await setupDevices());

        if (!StateStore.isEnabled()) {
            await Utils.resetDevices(DeviceStore.getDevices());
            return;
        }

        Logger.info(`Starting color sync with refresh rate of ${Config.getRefreshRate()}ms`);
        setInterval(async () => {
            if (SpotifyPlaybackStore.getPlaying()) {
                if (!Palette.isCycling()) Palette.initialize();

                const imageUrl = SpotifyPlaybackStore.getImageUrl();
                if (imageUrl) {
                    for (const device of DeviceStore.getDevices()) {
                        await Vibrant.from(imageUrl).getPalette(async (err, palette) => {
                            let rgb = [0, 0, 0];
                            if (palette == null) return;

                            switch (Palette.getPaletteMode().toString()) {
                                case "0":
                                    if (palette.Vibrant == null) return;
                                    rgb = palette.Vibrant.rgb;
                                    break;
                                case "1":
                                    if (palette.DarkVibrant == null) return;
                                    rgb = palette.DarkVibrant.rgb;
                                    break;
                                case "2":
                                    if (palette.LightVibrant == null) return;
                                    rgb = palette.LightVibrant.rgb;
                                    break;
                                case "3":
                                    if (palette.Muted == null) return;
                                    rgb = palette.Muted.rgb;
                                    break;
                                case "4":
                                    if (palette.DarkMuted == null) return;
                                    rgb = palette.DarkMuted.rgb;
                                    break;
                                case "5":
                                    if (palette.LightMuted == null) return;
                                    rgb = palette.LightMuted.rgb;
                                    break;
                                default:
                                    Logger.fatal(`Invalid palette mode ${Palette.getPaletteMode()}. Please run 'spotuya help' for more information.`);
                                    break;
                            }
                            device.setColor(Utils.rgbToHsv(rgb));
                        });
                    }
                }
            } else {
                Palette.destroy();
                await Utils.resetDevices(DeviceStore.getDevices());
            }
        }, Config.getRefreshRate());

        Logger.info("SpoTuya has started successfully!");
    }
}

export default start;