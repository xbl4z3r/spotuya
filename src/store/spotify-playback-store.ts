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

    private static previousTrackName: string = '';
    private static previousDurationMs: number = 0;
    private static previousProgressMs: number = 0;
    private static wasTrackSkipped: boolean = false;

    static setNowPlaying(newPlayback: NowPlaying) {
        const currentTrackName = newPlayback.track.name;

        if (this.previousTrackName !== '' &&
            this.previousTrackName !== currentTrackName) {
            if (this.previousDurationMs > 0) {
                const percentagePlayed = this.previousProgressMs / this.previousDurationMs;
                this.wasTrackSkipped = percentagePlayed < 0.9;
            }
        } else {
            this.wasTrackSkipped = false;
        }

        this.previousDurationMs = newPlayback.track.duration;
        this.previousProgressMs = newPlayback.progress;
        this.previousTrackName = currentTrackName;

        this.nowPlaying = newPlayback;
    }

    public static wasLastTrackSkipped(): boolean {
        return this.wasTrackSkipped;
    }

    static getNowPlaying(): NowPlaying {
        return this.nowPlaying;
    }
}