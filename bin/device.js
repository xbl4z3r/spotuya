import Logger from "./logger.js";
import Cloud from "./cloud.js";

export default class Device {
    id
    name
    key
    initialState
    lastColor = null;
    hasBeenReset = false
    interval = null;

    constructor(deviceData) {
        this.id = deviceData.id;
        this.name = deviceData.name;
        this.key = deviceData.key;
        this.hasBeenReset = false;
    }

    async initialize() {
        this.hasBeenReset = false;
        
        const response = await Cloud.getContext().request({
            method: 'GET',
            path: `/v1.0/devices/${this.id}/status`,
        });

        if (!response.success) {
            Logger.error('Failed to get device status');
            return;
        }

        if (response.result[1].value !== 'colour') {
            Logger.debug(`Setting device ${this.name} (${this.id}) to color mode...`);
            await Cloud.getContext().request({
                method: 'POST',
                path: `/v1.0/devices/${this.id}/commands`,
                body: {
                    commands: [
                        {
                            code: response.result[1].code,
                            value: 'colour',
                        },
                    ],
                },
            });
        }
        
        this.initialState = {
            powered: {
                code: response.result[0].code,
                value: response.result[0].value,
            },
            color: {
                code: response.result[2].code,
                value: JSON.parse(response.result[2].value),
            },
        };
        
        Logger.debug(`Device ${this.name} (${this.id}) initialized with state: ${JSON.stringify(this.initialState)}`);
    }
    
    setInterval(interval) {
        this.interval = interval;
    }

    setColor(color) {
        this.hasBeenReset = false;
        if (JSON.stringify(this.lastColor) === JSON.stringify(color)) return;
        this.lastColor = color;
        Logger.debug(`Setting device ${this.name} (${this.id}) to color: ${JSON.stringify(color)}`);
        Cloud.getContext().request({
            method: 'POST',
            path: `/v1.0/devices/${this.id}/commands`,
            body: {
                commands: [
                    {
                        code: this.initialState.powered.code,
                        value: true,
                    },
                    {
                        code: this.initialState.color.code,
                        value: color
                    }
                ],
            },
        });
    }

    async resetDevice() {
        if (this.hasBeenReset) return;
        Logger.debug(`Resetting device ${this.name} (${this.id}) to initial state...`);
        this.hasBeenReset = true;
        this.lastColor = null;
        await Cloud.getContext().request({
            method: 'POST',
            path: `/v1.0/devices/${this.id}/commands`,
            body: {
                commands: [
                    {
                        code: this.initialState.powered.code,
                        value: this.initialState.powered.value,
                    },
                    {
                        code: this.initialState.color.code,
                        value: JSON.stringify(this.initialState.color.value),
                    }
                ],
            },
        });
    }
    
    async destroy() {
        if (this.interval) clearInterval(this.interval);
    }
}