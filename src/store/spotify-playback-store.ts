import {NowPlaying} from "../@types/types.js";

export class SpotifyPlaybackStore {
    private static nowPlaying: NowPlaying = {
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

    static setNowPlaying(nowPlaying: NowPlaying) {
        this.nowPlaying = nowPlaying;
    }

    static getNowPlaying(): NowPlaying {
        return this.nowPlaying;
    }
}