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
    refreshRate: number,
    configVersion: string,
    startOnBoot: boolean,
    port: number,
    paletteMode: number,
    cycleRate: number,
    contrastOffset: number,
    outdatedConfigWarning: boolean,
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