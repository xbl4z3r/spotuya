export interface DeviceData {
    id: string,
    name: string,
    key: string,
    resetDevice?: () => Promise<void>,
}

export interface CommandData {
    powered: {
        code: string,
        value: boolean,
    },
    color: {
        code: string,
        value: string,
    },
}

export interface ConfigData {
    devices: DeviceData[],
    tuya: {
        clientId: string,
        clientSecret: string,
        region: string,
        userId: string,
    },
    spotify: {
        clientId: string,
        clientSecret: string,
        refreshToken: string,
        accessToken: string,
    },
    pollRate: number,
    pollMode: "static" | "dynamic",
    maxPollInterval: number,
    configVersion: string,
    startOnBoot: boolean,
    port: number,
    paletteMode: number,
    cycleRate: number,
    contrastOffset: number,
    outdatedConfigWarning: boolean,
    dataProvider: "spotify" | URL,
}

export interface CommandOption {
    name: string;
    alias?: string;
    description: string;
    required?: boolean;
    type?: 'string' | 'boolean' | 'number';
    default?: any;
}

export interface Command {
    name: string;
    aliases?: string[];
    description: string;
    options: CommandOption[];
    run: (args: string[], options: Record<string, any>) => Promise<void>;
}

export interface NowPlaying {
    initialized: boolean;
    error: string | null;
    is_playing: boolean;
    track: {
        name: string;
        artists: {
            name: string;
            url: string;
        }[];
        album: {
            name: string;
            url: string;
        };
        duration: number;
        artUrl: string;
        url: string;
    };
    progress: number;
    played_at: string;
    type: "track" | "episode" | "unknown";
}