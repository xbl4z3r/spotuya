import Device from "../core/device.js";

export class DeviceStore {
    private static devices: Device[] = [];

    static addDevice(device: Device): void {
        this.devices.push(device);
    }

    static addDevices(devices: Device[]): void {
        this.devices.push(...devices);
    }

    static getDevices() {
        return this.devices;
    }

    static getDevice(name: string) {
        return this.devices.find(device => device.name === name);
    }

    static removeDevice(name: string) {
        this.devices = this.devices.filter(device => device.name !== name);
    }
}