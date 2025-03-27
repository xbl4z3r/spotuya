import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec as execCb } from "child_process";
import Logger from "../utils/logger.js";
import Utils from "../utils/utils.js";

const exec = promisify(execCb);

export default class AutoStartService {
    private static readonly WIN_STARTUP_FOLDER = path.join(process.env.APPDATA || "", "Microsoft/Windows/Start Menu/Programs/Startup");
    private static readonly WIN_STARTUP_FILE = path.join(AutoStartService.WIN_STARTUP_FOLDER, "spotuya.vbs");
    private static readonly LINUX_AUTOSTART_DIR = path.join(process.env.HOME || "", ".config/autostart");
    private static readonly LINUX_DESKTOP_FILE = path.join(AutoStartService.LINUX_AUTOSTART_DIR, "spotuya.desktop");
    private static readonly MAC_LAUNCHAGENT_DIR = path.join(process.env.HOME || "", "Library/LaunchAgents");
    private static readonly MAC_PLIST_FILE = path.join(AutoStartService.MAC_LAUNCHAGENT_DIR, "com.spotuya.plist");

    static taskExists(): boolean {
        try {
            if (process.platform === 'win32') {
                return fs.existsSync(this.WIN_STARTUP_FILE);
            }
            else if (process.platform === 'darwin') {
                const plistPath = path.join(process.env.HOME!, 'Library/LaunchAgents/com.spotuya.plist');
                return fs.existsSync(plistPath);
            }
            else if (process.platform === 'linux') {
                const autostartPath = path.join(process.env.HOME!, '.config/autostart/spotuya.desktop');
                return fs.existsSync(autostartPath);
            }

            return false;
        } catch (error) {
            Logger.error(`Error checking for existing auto-start entry: ${error}`);
            return false;
        }
    }

    static async createTask(): Promise<void> {
        if (this.taskExists()) {
            Logger.warn("Autostart task already exists. Skipping setup.");
            return;
        }

        try {
            switch (process.platform) {
                case "win32":
                    await this.setupWindowsAutostart();
                    break;
                case "linux":
                    await this.setupLinuxAutostart();
                    break;
                case "darwin":
                    await this.setupMacAutostart();
                    break;
                default:
                    Logger.warn(`Autostart not supported on platform: ${process.platform}`);
            }
        } catch (error) {
            Logger.error(`Error setting up autostart: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    static async removeTask(): Promise<void> {
        try {
            switch (process.platform) {
                case "win32":
                    await this.removeWindowsAutostart();
                    break;
                case "linux":
                    await this.removeLinuxAutostart();
                    break;
                case "darwin":
                    await this.removeMacAutostart();
                    break;
                default:
                    Logger.warn(`Autostart removal not supported on platform: ${process.platform}`);
            }
        } catch (error) {
            Logger.error(`Error removing autostart: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private static async setupWindowsAutostart(): Promise<void> {
        try {
            const entryPoint = path.resolve(Utils.getEntryPoint());
            const scriptContent = `
Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "${process.cwd().replace(/\\/g, "\\\\")}"
WshShell.Run "cmd /c node ""${entryPoint}"" start", 0, False
`;
            fs.writeFileSync(this.WIN_STARTUP_FILE, scriptContent);
            Logger.info("Successfully set up Windows autostart via startup folder.");
        } catch (error) {
            throw new Error(`Failed to set up Windows autostart: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private static async setupLinuxAutostart(): Promise<void> {
        try {
            if (!fs.existsSync(this.LINUX_AUTOSTART_DIR)) {
                fs.mkdirSync(this.LINUX_AUTOSTART_DIR, { recursive: true });
            }

            const entryPoint = path.resolve(Utils.getEntryPoint());
            const desktopContent = `[Desktop Entry]
Type=Application
Name=SpoTuya
Comment=Spotify integration for Tuya devices
Exec=/usr/bin/node ${entryPoint} start
Path=${process.cwd()}
Terminal=false
Hidden=false
X-GNOME-Autostart-enabled=true
`;
            fs.writeFileSync(this.LINUX_DESKTOP_FILE, desktopContent);
            await exec(`chmod +x ${this.LINUX_DESKTOP_FILE}`);
            Logger.info("Successfully set up Linux autostart via desktop entry.");
        } catch (error) {
            throw new Error(`Failed to set up Linux autostart: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private static async setupMacAutostart(): Promise<void> {
        try {
            if (!fs.existsSync(this.MAC_LAUNCHAGENT_DIR)) {
                fs.mkdirSync(this.MAC_LAUNCHAGENT_DIR, { recursive: true });
            }

            const entryPoint = path.resolve(Utils.getEntryPoint());
            const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.spotuya</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>${entryPoint}</string>
        <string>start</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <false/>
    <key>WorkingDirectory</key>
    <string>${process.cwd()}</string>
    <key>StandardErrorPath</key>
    <string>${path.join(Utils.getApplicationDirectory(), "spotuya-error.log")}</string>
    <key>StandardOutPath</key>
    <string>${path.join(Utils.getApplicationDirectory(), "spotuya.log")}</string>
</dict>
</plist>`;

            fs.writeFileSync(this.MAC_PLIST_FILE, plistContent);
            await exec(`launchctl load ${this.MAC_PLIST_FILE}`);
            Logger.info("Successfully set up macOS autostart via LaunchAgent.");
        } catch (error) {
            throw new Error(`Failed to set up macOS autostart: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private static async removeWindowsAutostart(): Promise<void> {
        try {
            if (fs.existsSync(this.WIN_STARTUP_FILE)) {
                fs.unlinkSync(this.WIN_STARTUP_FILE);
                Logger.info("Successfully removed Windows autostart.");
            }
        } catch (error) {
            throw new Error(`Failed to remove Windows autostart: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private static async removeLinuxAutostart(): Promise<void> {
        try {
            if (fs.existsSync(this.LINUX_DESKTOP_FILE)) {
                fs.unlinkSync(this.LINUX_DESKTOP_FILE);
                Logger.info("Successfully removed Linux autostart.");
            }
        } catch (error) {
            throw new Error(`Failed to remove Linux autostart: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    private static async removeMacAutostart(): Promise<void> {
        try {
            if (fs.existsSync(this.MAC_PLIST_FILE)) {
                try {
                    await exec(`launchctl unload ${this.MAC_PLIST_FILE}`);
                } catch (error) {
                    Logger.warn(`Error unloading launchctl: ${error instanceof Error ? error.message : String(error)}`);
                }

                fs.unlinkSync(this.MAC_PLIST_FILE);
                Logger.info("Successfully removed macOS autostart.");
            }
        } catch (error) {
            throw new Error(`Failed to remove macOS autostart: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}