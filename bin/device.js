import Logger from "./logger.js";

export const DeviceType = {
    TYPE_A: 'TYPE_A',
    TYPE_B: 'TYPE_B'
}

export default class Device {
    tuyaDevice
    deviceType
    initialState
    hasBeenReset = false

    constructor(tuyaDevice, deviceType, initialState) {
        this.tuyaDevice = tuyaDevice;
        this.deviceType = deviceType;
        this.initialState = initialState;
    }

    updateDevice(status, color) {
        this.hasBeenReset = false;
        switch (this.deviceType) {
            case DeviceType.TYPE_B:
                this.tuyaDevice.set({
                    multiple: true,
                    data: {
                        '20': status,
                        '22': 1000,
                        '23': 1000,
                        '24': color,
                    },
                    shouldWaitForResponse: false
                });
                break;
            case DeviceType.TYPE_A:
                this.tuyaDevice.set({
                    multiple: true,
                    data: {
                        '1': status,
                        '3': 1000,
                        '4': 1000,
                        '5': color,
                    },
                    shouldWaitForResponse: false
                });
                break;
            default:
                Logger.fatal("Invalid device found. Did Tuya implement a new device type?");
        }
    }

    resetDevice(shouldWait = false) {
        if (this.hasBeenReset) return;
        Logger.debug('Resetting device ' + this.tuyaDevice.device.id + ' to ' + this.initialState.powered + ' and ' + this.initialState.color);
        this.hasBeenReset = true;
        switch (this.deviceType) {
            case DeviceType.TYPE_B:
                this.tuyaDevice.set({
                    multiple: true,
                    data: {
                        '20': this.initialState.powered,
                        '22': 100,
                        '23': 100,
                        '24': this.initialState.color,
                    },
                    shouldWaitForResponse: shouldWait
                });
                break;
            case DeviceType.TYPE_A:
                this.tuyaDevice.set({
                    multiple: true,
                    data: {
                        '1': this.initialState.powered,
                        '5': this.initialState.color,
                    },
                    shouldWaitForResponse: shouldWait
                });
                break;
            default:
                Logger.fatal("Invalid device found. Did Tuya implement a new device type?");
        }
    }

    getDeviceType() {
        return this.deviceType;
    }

    getTuyaDevice() {
        return this.tuyaDevice;
    }

    setDeviceType(deviceType) {
        this.deviceType = deviceType;
    }

    getStatusId() {
        switch (this.deviceType) {
            case DeviceType.TYPE_A:
                return '1';
            case DeviceType.TYPE_B:
                return '20';
            default:
                Logger.fatal('Unknown device type');
        }
    }

    getColorId() {
        switch (this.deviceType) {
            case DeviceType.TYPE_A:
                return '5';
            case DeviceType.TYPE_B:
                return '24';
            default:
                Logger.fatal('Unknown device type');
        }
    }

    setDefaultState(state) {
        this.initialState = state;
    }
}