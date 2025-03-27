import inquirer from "inquirer";
import {TuyaContext} from "@tuya/tuya-connector-nodejs";
import Logger from "./logger.js";
import chalk from "chalk";
import Utils from "./utils.js";
import {ConfigData} from "../@types/types";

const REGIONS = ['eu', 'us', 'cn', 'in'];

export default class Cloud {
    context: any
    userId: string = ""
    region: string = ""
    static instance = new Cloud();

    static async initialize(config: ConfigData['tuya']) {
        Cloud.instance.userId = config.userId;
        Cloud.instance.region = config.region;
        Cloud.instance.context = new TuyaContext({
            baseUrl: `https://openapi.tuya${config.region}.com`,
            accessKey: config.clientId,
            secretKey: config.clientSecret
        });
    }

    static async wizard() {
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
        let foundUserId;
        let foundAPIRegion;

        try {
            // @ts-ignore
            const {device, region} = await Promise.any(REGIONS.map(async region => {
                const api = new TuyaContext({
                    baseUrl: `https://openapi.tuya${region}.com`,
                    accessKey: answers.clientId,
                    secretKey: answers.clientSecret
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

            foundUserId = device.uid;
            foundAPIRegion = region;
        } catch (error) {
            Logger.fatal("Error while setting up... Make sure your details are correct and try again.");
        }

        // Get user devices
        const api = new TuyaContext({
            baseUrl: `https://openapi.tuya${foundAPIRegion}.com`,
            accessKey: answers.clientId,
            secretKey: answers.clientSecret
        });

        const result = await api.request({
            method: 'GET',
            path: `/v1.0/users/${foundUserId}/devices`
        });

        if (!result.success) {
            Logger.fatal("Error while setting up... Make sure your details are correct and try again.");
        }

        const groupedDevices: any = {};
        // @ts-ignore
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
        return {
            devices: Object.values(groupedDevices).map((device: any) => {
                const pretty = {
                    name: device.name,
                    id: device.id,
                    key: device.local_key,
                    subDevices: []
                };
                if (device.subDevices) {
                    pretty.subDevices = device.subDevices.map((subDevice: { name: any; id: any; node_id: any; }) => ({
                        name: subDevice.name,
                        id: subDevice.id,
                        cid: subDevice.node_id
                    }));
                }
                return pretty;
            }),
            userId: foundUserId,
            region: foundAPIRegion,
            clientId: answers.clientId,
            clientSecret: answers.clientSecret
        };
    }

    static getContext() {
        return Cloud.instance.context;
    }
}