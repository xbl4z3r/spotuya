import SpotifyWebApi from "spotify-web-api-node";
import Logger from "../utils/logger.js";
import {SpotifyTokenStore} from "../store/spotify-token-store.js";
import {NowPlaying} from "../@types/types.js";
import {SpotifyPlaybackStore} from "../store/spotify-playback-store.js";

export class SpotifyApiService {
    private static instance = new SpotifyApiService();
    private static pollingInterval: NodeJS.Timeout | null = null;
    private static intervalDuration = 5000;
    private spotifyApi: SpotifyWebApi | null = null;

    static initialize(clientId: string, clientSecret: string, accessToken: string | null = null) {
        SpotifyApiService.instance.spotifyApi = new SpotifyWebApi({
            clientId: clientId,
            clientSecret: clientSecret,
            // @ts-ignore
            scope: 'user-read-currently-playing user-read-playback-state',
        });
        if (accessToken) SpotifyApiService.setAccessToken(accessToken);
    }

    static async fetchCurrentPlayback(): Promise<NowPlaying> {
        let nowPlaying: NowPlaying = {
            initialized: false,
            error: null,
            is_playing: false,
            track: {
                name: "Not Playing",
                artists: [{name: "No Artist", url: ""}],
                album: {name: "No Album", url: ""},
                duration: 1,
                artUrl: "https://placehold.co/200",
                url: "",
            },
            progress: 0,
            played_at: Date.now().toString(),
            type: "unknown",
        };

        try {
            const data = await SpotifyApiService.getApi().getMyCurrentPlaybackState();
            if (data.body && data.body.item) {
                nowPlaying.initialized = true;
                nowPlaying.error = null;
                nowPlaying.is_playing = data.body.is_playing;
                nowPlaying.track.name = data.body.item.name;
                if (data.body.item.type === "track") {
                    nowPlaying.track.artists = data.body.item.artists?.map((artist: {
                        name: string;
                        external_urls: { spotify: string }
                    }) => ({
                        name: artist.name,
                        url: artist.external_urls.spotify,
                    })) || [];
                    nowPlaying.track.album = {
                        name: data.body.item.album?.name,
                        url: data.body.item.external_urls.spotify,
                    };
                    nowPlaying.track.artUrl = data.body.item.album?.images?.[0]?.url;
                } else if (data.body.item.type === "episode") {
                    nowPlaying.track.artists = [{
                        name: data.body.item.show.name,
                        url: data.body.item.show.external_urls.spotify
                    }];
                    nowPlaying.track.album = {
                        name: data.body.item.show.name,
                        url: data.body.item.external_urls.spotify
                    };
                    nowPlaying.track.artUrl = data.body.item.images?.[0]?.url;
                }
                nowPlaying.track.url = data.body.item.external_urls.spotify;
                nowPlaying.progress = data.body.progress_ms || 0;
                nowPlaying.played_at = new Date(data.body.timestamp).toString();
                nowPlaying.type = data.body.item.type;
            } else {
                nowPlaying.is_playing = false;
                nowPlaying.initialized = true;
                nowPlaying.error = "No active playback";
            }
        } catch (error: any) {
            if (error.toString().includes("access token")) {
                SpotifyTokenStore.getAccessToken().then((tokens: {
                    access_token: string;
                    refresh_token: string;
                }) => {
                    SpotifyApiService.setAccessToken(tokens.access_token);
                });
            } else {
                Logger.error(`Failed to fetch playback state: ${error}`);
                nowPlaying.is_playing = false;
                nowPlaying.initialized = true;
                nowPlaying.error = error;
            }
        }

        return nowPlaying;
    }

    static startPolling(interval: number = this.intervalDuration) {
        if (this.pollingInterval) {
            this.stopPolling();
        }

        this.intervalDuration = interval;
        this.fetchCurrentPlayback().then(playback => SpotifyPlaybackStore.setNowPlaying(playback));

        this.pollingInterval = setInterval(() => {
            this.fetchCurrentPlayback().then(playback => SpotifyPlaybackStore.setNowPlaying(playback));
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

    static setAccessToken(accessToken: string) {
        if (SpotifyApiService.instance.spotifyApi) SpotifyApiService.instance.spotifyApi.setAccessToken(accessToken);
        else Logger.error("Spotify API not initialized");
    }

    static getApi(): SpotifyWebApi {
        if (!SpotifyApiService.instance.spotifyApi) Logger.error("Spotify API not initialized");
        return SpotifyApiService.instance.spotifyApi as SpotifyWebApi;
    }
}