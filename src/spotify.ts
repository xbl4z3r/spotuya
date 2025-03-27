import open from "open";
import request from "request";

import Logger from "./logger.js";
import Utils from "./utils.js";
import SpotifyWebApi from "spotify-web-api-node";
import Config from "./config.js";

const SCOPE = [
    'user-read-playback-state',
    'user-read-currently-playing',
].join('%20')

export class SpotifyTokenStore {
    static CLIENT_ID = "";
    static CLIENT_SECRET = "";
    static accessToken = "";
    static refreshToken = "";

    static async getAccessToken(): Promise<{
        access_token: string,
        refresh_token: string
    }> {
        return new Promise(async (resolve) => {
            if (this.refreshToken.length > 5) {
                Logger.debug("Logging in with refresh token...");
                const authOptions = {
                    url: 'https://accounts.spotify.com/api/token',
                    headers: {'Authorization': 'Basic ' + (Buffer.from(SpotifyTokenStore.CLIENT_ID + ':' + SpotifyTokenStore.CLIENT_SECRET).toString('base64'))},
                    form: {
                        grant_type: 'refresh_token',
                        refresh_token: this.refreshToken
                    },
                    json: true
                };
                request.post(authOptions, function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        SpotifyTokenStore.accessToken = body.access_token;
                        if (body.refresh_token) SpotifyTokenStore.refreshToken = body.refresh_token
                        const response = {
                            access_token: SpotifyTokenStore.accessToken,
                            refresh_token: SpotifyTokenStore.refreshToken
                        }
                        resolve(response);
                    }
                });
            } else {
                Logger.debug("Requesting new access token...");
                await open('https://accounts.spotify.com/authorize'
                    + '?client_id=' + this.CLIENT_ID
                    + '&response_type=code'
                    + '&scope=' + SCOPE
                    + '&show_dialog=' + false
                    + '&redirect_uri=' + 'http://localhost:' + Config.getPort() + '/callback'
                    + '&state=' + Utils.generateRandomString(16)
                );
                const interval = setInterval(() => {
                    if (this.accessToken.length > 5) {
                        clearInterval(interval);
                        const response = {
                            access_token: this.accessToken,
                            refresh_token: this.refreshToken
                        }
                        resolve(response);
                    }
                }, 1000);
            }
        })
    }

    static setClientId(clientId: string) {
        this.CLIENT_ID = clientId;
    }

    static setClientSecret(clientSecret: string) {
        this.CLIENT_SECRET = clientSecret;
    }

    static setRefreshToken(refreshToken: string) {
        this.refreshToken = refreshToken;
    }
}

export class SpotifyPlaybackStore {
    static isPlaying = false;
    static songName = "";
    static artistName = "";
    static albumName = "";
    static imageUrl = "";
    static progress = 0;

    static setPlaying(playing: boolean) {
        this.isPlaying = playing;
    }

    static setSongName(songName: string) {
        this.songName = songName;
    }

    static setArtistName(artistName: string) {
        this.artistName = artistName;
    }

    static setAlbumName(albumName: string) {
        this.albumName = albumName;
    }

    static setImageUrl(imageUrl: string) {
        this.imageUrl = imageUrl;
    }

    static setProgress(progress: number) {
        this.progress = progress;
    }

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
}

export class SpotifyApiProvider {
    spotifyApi: SpotifyWebApi | null = null;
    static instance = new SpotifyApiProvider();

    static initialize(clientId: string, clientSecret: string, accessToken: string | null = null) {
        SpotifyApiProvider.instance.spotifyApi = new SpotifyWebApi({
            clientId: clientId,
            clientSecret: clientSecret,
            // @ts-ignore
            scope: 'user-read-currently-playing user-read-playback-state',
        });
        if (accessToken) SpotifyApiProvider.setAccessToken(accessToken);
    }

    static setAccessToken(accessToken: string) {
        if(SpotifyApiProvider.instance.spotifyApi) SpotifyApiProvider.instance.spotifyApi.setAccessToken(accessToken);
        else Logger.error("Spotify API not initialized");
    }

    static getApi(): SpotifyWebApi {
        if(!SpotifyApiProvider.instance.spotifyApi) Logger.error("Spotify API not initialized");
        return SpotifyApiProvider.instance.spotifyApi as SpotifyWebApi;
    }
}