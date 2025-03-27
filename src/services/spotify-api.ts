import SpotifyWebApi from "spotify-web-api-node";
import Logger from "../utils/logger.js";

export class SpotifyApiService {
    spotifyApi: SpotifyWebApi | null = null;
    static instance = new SpotifyApiService();

    static initialize(clientId: string, clientSecret: string, accessToken: string | null = null) {
        SpotifyApiService.instance.spotifyApi = new SpotifyWebApi({
            clientId: clientId,
            clientSecret: clientSecret,
            // @ts-ignore
            scope: 'user-read-currently-playing user-read-playback-state',
        });
        if (accessToken) SpotifyApiService.setAccessToken(accessToken);
    }

    static setAccessToken(accessToken: string) {
        if(SpotifyApiService.instance.spotifyApi) SpotifyApiService.instance.spotifyApi.setAccessToken(accessToken);
        else Logger.error("Spotify API not initialized");
    }

    static getApi(): SpotifyWebApi {
        if(!SpotifyApiService.instance.spotifyApi) Logger.error("Spotify API not initialized");
        return SpotifyApiService.instance.spotifyApi as SpotifyWebApi;
    }
}