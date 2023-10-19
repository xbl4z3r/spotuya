import inquirer from "inquirer";
import {TuyaContext} from "@tuya/tuya-connector-nodejs";
import Logger from "./logger.js";
import chalk from "chalk";
import Utils from "./utils.js";

const REGIONS = ['eu', 'us', 'cn', 'in'];

export default class Cloud {
    static wizard = async () => {
        let questions = [
            {
                name: 'deviceId',
                message: 'Provide a \'virtual ID\' of a device currently registered in the app:',
                prefix: chalk.hex(Utils.SPOTIFY_COLOR)("[SpoTuya - " + new Date().toLocaleTimeString('en-US', {hour12: false}) + "]")
            }
        ];

        questions = [...Utils.TUYA_API_QUESTIONS, ...questions];

        const answers = await inquirer.prompt(questions);

        // Get seed device
        let userId;
        let foundAPIRegion;

        try {
            const {device, region} = await Promise.any(REGIONS.map(async region => {
                const api = new TuyaContext({
                    baseUrl: `https://openapi.tuya${region}.com`,
                    accessKey: answers.apiKey,
                    secretKey: answers.apiSecret
                });

                const result = await api.request({
                    method: 'GET',
                    path: `/v1.0/devices/${answers.deviceId}`
                });

                if (!result.success) {
                    throw new Error(`${result.code}: ${result.msg}`);
                }

                return {device: result.result, region};
            }));

            userId = device.uid;
            foundAPIRegion = region;
        } catch (error) {
            Logger.fatal("Error while setting up... Make sure your details are correct and try again.");
        }

        // Get user devices
        const api = new TuyaContext({
            baseUrl: `https://openapi.tuya${foundAPIRegion}.com`,
            accessKey: answers.apiKey,
            secretKey: answers.apiSecret
        });

        const result = await api.request({
            method: 'GET',
            path: `/v1.0/users/${userId}/devices`
        });

        if (!result.success) {
            Logger.fatal("Error while setting up... Make sure your details are correct and try again.");
        }

        const groupedDevices = {};
        for (const device of result.result) {
            if (device.node_id) {
                if (!groupedDevices[device.local_key] || !groupedDevices[device.local_key].subDevices) {
                    groupedDevices[device.local_key] = {...groupedDevices[device.local_key], subDevices: []};
                }

                groupedDevices[device.local_key].subDevices.push(device);
            } else {
                groupedDevices[device.local_key] = {...device, ...groupedDevices[device.local_key]};
            }
        }

        // Output devices
        return Object.values(groupedDevices).map(device => {
            const pretty = {
                name: device.name,
                id: device.id,
                key: device.local_key
            };
            if (device.subDevices) {
                pretty.subDevices = device.subDevices.map(subDevice => ({
                    name: subDevice.name,
                    id: subDevice.id,
                    cid: subDevice.node_id
                }));
            }
            return pretty;
        });
    }
}