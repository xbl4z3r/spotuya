import Config from "./config.js";

export default class PaletteProvider {
    static paletteMode = 0;
    static interval = null;
    
    static initialize() {
        this.paletteMode = Config.getPaletteMode();
        if (this.paletteMode === undefined || this.paletteMode > 5) {
            this.paletteMode = 0;
            Config.setPaletteMode(0);
        }
        
        if (this.paletteMode === -1) {
            this.paletteMode = 0;
            this.interval = setInterval(() => {
                this.paletteMode = (this.paletteMode + 1) % 6;
            }, Config.getCycleRate());
        }
    }

    static destroy() {
        if (this.isCycling()) clearInterval(this.interval);
    }
    
    static getPaletteMode() {
        return this.paletteMode;
    }
    
    static isCycling() {
        return this.interval !== null;
    }
}