import pm2 from "pm2";
import Logger from "./logger.js";
import Utils from "./utils.js";

export default class PM2Provider {
    static createTask() {
        pm2.connect((connectionError) => {
            if (connectionError) Logger.error("Error while setting up PM2 provider: " + connectionError);
            let doesExist = false;
            pm2.list((err, processDescriptionList) => {
                if (err) return doesExist = false;
                processDescriptionList.forEach((processDescription) => {
                    if (processDescription.name === Utils.getPackageName()) doesExist = true;
                });
                if (doesExist) {
                    Logger.debug("PM2 provider already exists. Disconnecting...");
                    return pm2.disconnect();
                }
                pm2.start({
                    script: 'bin/spotuya.js',
                    name: Utils.getPackageName(),
                    args: ['start'],
                    autorestart: true
                }, (err, apps) => {
                    if (err) Logger.error("Error while setting up PM2 provider: " + err);
                    else Logger.debug("Successfully set up PM2 provider.");
                    pm2.disconnect();
                });
            });
        });
    }

    static removeTask() {
        pm2.connect((connectionError) => {
            if (connectionError) Logger.error("Error while setting up PM2 provider: " + connectionError);
            Logger.info("Disabling PM2 provider...");
            let doesExist = false;
            pm2.list((err, processDescriptionList) => {
                if (err) return doesExist = false;
                processDescriptionList.forEach((processDescription) => {
                    if (processDescription.name === Utils.getPackageName()) doesExist = true;
                });
                if (!doesExist) {
                    Logger.debug("PM2 provider does not exist. Disconnecting...");
                    return pm2.disconnect();
                }
                pm2.delete(Utils.getPackageName(), (err, apps) => {
                    if (err) Logger.error("Error while disabling PM2 provider: " + err);
                    else Logger.debug("Successfully disabled PM2 provider.");
                    pm2.disconnect();
                });
            });
        });
    }

    static killAllProcesses() {
        pm2.connect((connectionError) => {
            if (connectionError) Logger.error("Error while setting up PM2 provider: " + connectionError);
            Logger.info("Killing all PM2 processes...");
            pm2.stop(Utils.getPackageName(), (err, apps) => {
                if (err) Logger.error("Error while killing all PM2 processes: " + err);
                else Logger.info("Successfully killed all PM2 processes.");
                pm2.disconnect();
            });
        });
    }
}