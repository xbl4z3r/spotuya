export type DeviceData = {
    id: string,
    name: string,
    key: string,
    resetDevice?: () => Promise<void>,
    destroy?: () => Promise<void>,
}

export type CommandData = {
    powered: {
        code: string,
        value: boolean,
    },
    color: {
        code: string,
        value: string,
    },
}

export type ConfigData = {
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
}