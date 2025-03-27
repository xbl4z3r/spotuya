import Logger from "../utils/logger.js";
import {SpotifyApiService} from "../services/spotify-api.js";
import {SpotifyTokenStore} from "../store/spotify-token-store.js";

export class SpotifyPlaybackStore {
    static isPlaying = false;
    static songName = "";
    static artistName = "";
    static albumName = "";
    static imageUrl = "";
    static progress = 0;
    static pollingInterval: NodeJS.Timeout | null = null;
    static intervalDuration = 5000;

    static getSongName() {
        return this.songName;
    }

    static getArtistName() {
        return this.artistName;
    }

    static getAlbumName() {
        return this.albumName;
    }

    static getImageUrl() {
        return this.imageUrl;
    }

    static getProgress() {
        return this.progress;
    }

    static getPlaying() {
        return this.isPlaying;
    }

    static async fetchCurrentPlayback(): Promise<boolean> {
        try {
            const data = await SpotifyApiService.getApi().getMyCurrentPlaybackState();
            if (data.body && data.body.item) {
                this.isPlaying = data.body.is_playing || false;
                this.songName = data.body.item.name || "";
                if (data.body.item.type === "track") {
                    this.artistName = data.body.item.artists?.map((artist: {
                        name: string;
                    }) => artist.name).join(", ") || "";
                    this.albumName = data.body.item.album?.name || "";
                    this.imageUrl = data.body.item.album?.images?.[0]?.url || "";
                } else {
                    this.artistName = data.body.item.show.name;
                    this.albumName = data.body.item.show.name;
                    this.imageUrl = data.body.item.images?.[0]?.url || "";
                }
                this.progress = data.body.progress_ms || 0;
                return true;
            } else {
                this.isPlaying = false;
                return false;
            }
        } catch (error) {
            Logger.error(`Failed to fetch playback state: ${error}`);
            // Try to refresh the access token
            SpotifyTokenStore.getAccessToken().then((tokens: {
                access_token: string;
                refresh_token: string;
            }) => {
                SpotifyApiService.setAccessToken(tokens.access_token);
            })
            return false;
        }
    }

    static startPolling(interval: number = this.intervalDuration) {
        if (this.pollingInterval) {
            this.stopPolling();
        }

        this.intervalDuration = interval;
        this.fetchCurrentPlayback();

        this.pollingInterval = setInterval(async () => {
            await this.fetchCurrentPlayback();
        }, interval);

        Logger.debug(`Spotify playback polling started with ${interval}ms interval`);
    }

    static stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            Logger.debug("Spotify playback polling stopped");
        }
    }

    static setPollingInterval(interval: number) {
        this.intervalDuration = interval;
        if (this.pollingInterval) {
            this.stopPolling();
            this.startPolling(interval);
        }
    }

    static isPolling(): boolean {
        return this.pollingInterval !== null;
    }
}