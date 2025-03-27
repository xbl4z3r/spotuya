export class StateStore {
    static enabled = true;

    static isEnabled() {
        return this.enabled;
    }

    static enable() {
        this.enabled = true;
    }

    static disable() {
        this.enabled = false;
    }
}