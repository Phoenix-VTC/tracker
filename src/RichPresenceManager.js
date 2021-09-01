const clientId = '823583866702921739'
const DiscordRPC = require('discord-rpc')

const tst = require("trucksim-telemetry")

const config = require('electron-cfg')
const configFile = require('./config')

const util = require('util');

const fetch = require('electron-fetch').default
const axios = require('axios').default

const ray = require('node-ray').ray

class RichPresenceManager {
    constructor() {
        this.telemetry = tst();

        // setting initial variables state
        this.rpc = null;
        this.mpCheckerIntervalTime = configFile.mpCheckerIntervalMilliseconds;
        this.locationCheckerIntervalTime = configFile.locationCheckerIntervalMilliseconds;

        this.mpInfo = null
        this.lastData = null
        this.rpcReady = false
        this.rpcOnChangingState = false
        this.mpCheckerInterval = null
        this.locationCheckerInterval = null
        this.locationInfo = null

        ray('Construct')
    }

    init() {
        this.bindETCarsEvents()
        this.telemetry.watch()

        ray('Init')
    }

    bindETCarsEvents() {
        ray('Bind Start')
        const instance = this;

        this.telemetry.game.on('time-change', function () {
            ray('time change')
            console.log('time change')
            //use a try / catch as sometimes the data isn't there when first connecting...plus it's json parsing...
            try {
                const data = tst.getData()

                // putting apart last data received
                instance.lastData = data;

                ray(data.truck.position.X)

                // telemetry exists

                // begin to initialize Discord RPC
                // checking if is in valid state
                if (!instance.rpcOnChangingState) {

                    // checking if is not ready
                    if (!instance.rpcReady) {

                        instance.rpcOnChangingState = true;

                        instance.timestamp = Date.now()

                        if (!instance.checkIfMultiplayer(data)) {
                            instance.startLocationChecker();
                        }

                        // creating a new Discord RPC Client instance
                        instance.rpc = new DiscordRPC.Client({
                            transport: 'ipc'
                        })

                        // login to RPC
                        instance.rpc.login({clientId: clientId}).then(() => {
                            // cleaning up variables to save RPC Client state
                            instance.rpcReady = true;
                            instance.rpcOnChangingState = false;
                        }).catch(console.error);
                    }
                }

                if (instance.rpcReady) {
                    // checking if playing in multiplayer and loading online state, server and position
                    console.log(instance.checkIfMultiplayer())
                    if (instance.checkIfMultiplayer() && instance.mpInfo == null && !instance.TRUCKYERROR) {
                        console.log('pass')
                        instance.startMPChecker();
                        instance.checkMpInfo();
                    }

                    const activity = instance.buildActivity(data);

                    ray(activity)

                    if (activity != null) {
                        instance.rpc.setActivity(activity);
                    }
                }
            } catch (error) {
                console.log(error);
            }
        });

        this.telemetry.game.on('connect', function () {
            console.log('Connected to game')
        });

        //TODO: Check for alternative
        this.telemetry.game.on('disconnect', function () {
            instance.resetETCarsData();
            instance.resetRPCClient();
            instance.resetMPChecker();
            instance.resetLocationChecker();
        });
    }

    startMPChecker() {
        if (this.mpCheckerInterval == null) {
            const instance = this;
            this.mpCheckerInterval = setInterval(() => {
                instance.checkMpInfo()
            }, this.mpCheckerIntervalTime);
        }
    }

    startLocationChecker() {
        if (this.locationCheckerInterval == null) {
            const instance = this;
            this.locationCheckerInterval = setInterval(() => {
                instance.checkLocationInfo()
            }, this.locationCheckerIntervalTime);
            console.log('Starting Location Checker interval');
        }
    }

    resetETCarsData() {
        this.lastData = null;
        this.mpInfo = null;
        this.mpStatsInfo = null;
        this.locationInfo = null;
    }

    resetMPChecker() {
        if (this.mpCheckerInterval != null) {
            clearInterval(this.mpCheckerInterval);
            this.mpCheckerInterval = null;
            this.mpInfo = null;
            this.locationInfo = null;
            console.log('MP Checker interval reset');
        }
    }

    resetLocationChecker() {
        if (this.locationCheckerInterval != null) {
            clearInterval(this.locationCheckerInterval);
            this.locationCheckerInterval = null;
            this.locationInfo = null;
            console.log('Location Checker interval reset');
        }
    }

    // TODO: Fix
    // Currently all RPC multiplayer functionality is broken
    checkIfMultiplayer() {
        axios.get(`https://traffic.krashnz.com/api/v2/user/${config.get('user').truckersmp_id}`).then((response) => {
            response = response.data

            if (response.error) {
                return false
            }

            console.log(response.response.online)
            return response.response.online
        })
    }

    checkMpInfo() {
        const instance = this;

        if (this.lastData != null && this.checkIfMultiplayer(this.lastData)) {

            console.log('Checking online status');

            const url = util.format('https://api.truckyapp.com/v2/map/onlineList?ids=%s', config.get('user').truckersmp_id);

            fetch(url).then((body) => {
                return body.json()
            }).then((json) => {
                if (!json.error) {
                    const response = json.response;

                    if (response.players[0].online) {
                        instance.mpInfo = {
                            online: true,
                            server: response.players[0].serverDetails,
                            apiserverid: response.players[0].serverDetails.apiserverid,
                            playerid: response.players[0].p_id,
                            mod: response.players[0].serverDetails.mod
                        };
                        instance.locationInfo = {
                            location: response.players[0].location.poi.realName,
                            inCity: response.players[0].location.area
                        }
                    } else {
                        instance.mpInfo = {
                            online: false,
                            server: false,
                            apiserverid: false,
                            playerid: false,
                            mod: false
                        }
                        instance.locationInfo = {
                            location: false,
                            inCity: false
                        };
                        instance.TRUCKYERROR = false;
                    }
                } else {
                    instance.mpInfo = null;
                    instance.TRUCKYERROR = true;
                    console.log('Trucky API is currently having issues - MP Checker has been stopped.');
                    instance.resetMPChecker();
                    instance.resetLocationChecker();
                }
            });
        }
    }

    checkLocationInfo() {
        const instance = this;

        if (this.lastData.truck.position.X === 0) {
            instance.locationInfo = {
                location: false,
                inCity: null,
            };
        } else {
            const url = util.format('https://api.truckyapp.com/v2/map/%s/resolve?x=%s&y=%s', this.lastData.game.game.name, this.lastData.truck.position.X, this.lastData.truck.position.Z);

            //console.log(url);
            fetch(url).then((body) => {
                return body.json()
            }).then((json) => {

                if (!json.error) {
                    const response = json.response;

                    instance.locationInfo = {
                        location: response.poi.realName,
                        inCity: response.area,
                    };
                } else {
                    instance.locationInfo = {
                        location: false,
                        inCity: null,
                    };
                }
            });
        }
    }

    buildActivity(data) {
        let activity = {};

        this.gameLoading = data.truck.brand.name === false;

        const speed = data.truck.speed.value;

        activity.smallImageText = `${data.truck.brand.name} ${data.truck.model.name} - ${this.calculateDistance(data.truck.odometer, this.isAts(data))} ${this.getDistanceUnit(this.isAts(data))}`;

        if (!this.gameLoading) {
            if (configFile.supportedBrands.includes(data.truck.make.name.toLowerCase())) {
                activity.smallImageKey = `brand_${data.truck.make.id}`;
            }
        }

        activity.details = '';
        activity.state = '';
        activity.startTimestamp = this.timestamp;

        ray('Job:')
        ray(data.job)

        if (data.job.income > 0) {
            if (data.job.source.city.name !== null) {
                activity.details += `🚚 ${data.job.source.city.name} > ${data.job.destination.city.name} | ${data.truck.make.name} ${data.truck.model.name}`;
            } else {
                activity.details += `🚧 Special Transport | ${data.truck.make.name} ${data.truck.model.name}`
            }
        } else {
            if (this.gameLoading) {
                activity.details += `🕗 Loading game...`
            } else {
                activity.details += `🚛 Freeroaming | ${data.truck.make.name} ${data.truck.model.name}`;
            }
        }

        if (!this.gameLoading && data.truck.engine.enabled === true) {
            activity.details += util.format(` at ${this.calculateSpeed(speed, this.isAts(data))}${this.getSpeedUnit(this.isAts(data))}`);
        }

        activity.largeImageText = 'Phoenix Tracker';
        activity.largeImageKey = 'logo_bg';

        if (this.mpInfo != null && this.mpInfo.online !== false) {
            activity.state += util.format('🌐 %s', this.mpInfo.server.name);
            activity.largeImageText += util.format(' | ID: %s', this.mpInfo.playerid)
        } else {
            activity.state = '🌐 Singleplayer';
        }


        if (this.locationInfo != null && this.locationInfo.inCity === true) {
            this.inCityDetection = 'At';
        } else if (this.locationInfo != null && this.locationInfo.inCity === false) {
            this.inCityDetection = 'Near';
        } else {
            this.inCityDetection = null;
        }

        if (this.locationInfo && this.inCityDetection && this.locationInfo.location) {
            activity.state += util.format(' - %s %s', this.inCityDetection, this.locationInfo.location);
        }

        activity.buttons = [
            {'label': 'View Profile', 'url': `https://base.phoenixvtc.com/users/${config.get('user').truckersmp_id}`},
            {'label': 'Learn More', 'url': 'https://phoenixvtc.com'}
        ]

        return activity;
    }

    isAts(data) {
        ray(`Game ID: ${data.game.game.name}`)

        return data.game.game.name === configFile.constants.ats;
    }

    getSpeedUnit(isAts) {
        if (isAts) {
            return configFile.mphString;
        }

        return configFile.kphString
    }

    calculateSpeed(value, isAts) {
        value = value * configFile.constants.speedMultiplierValue;

        if (isAts) {
            return Math.round(value * configFile.kmToMilesConversion);
        }
        return Math.round(value);
    }

    getDistanceUnit(isAts) {
        if (isAts) {
            return configFile.milesString;
        }

        return configFile.kmString;
    }

    calculateDistance(value, isAts) {
        if (isAts) {
            return Math.round(value * configFile.kmToMilesConversion);
        } else {
            return Math.round(value);
        }
    }

    resetRPCClient() {
        if (this.rpc != null) {
            this.rpc.setActivity({
                details: 'Game not running',
                startTimestamp: this.timestamp,
                largeImageKey: 'logo_bg',
                buttons: [
                    {'label': 'Learn More', 'url': 'https://phoenixvtc.com'},
                    {'label': 'View Profile', 'url': 'https://base.phoenixvtc.com/users/1'}
                ]
            })
        }
    }

    // init() {
    //     console.log('RPC Manager')
    //
    //     rpc.on('ready', () => {
    //         rpc.setActivity({
    //             details: 'Game not running',
    //             startTimestamp,
    //             largeImageKey: 'logo_bg',
    //             buttons: [
    //                 {'label': 'Learn More', 'url': 'https://phoenixvtc.com'},
    //                 {'label': 'View Profile', 'url': 'https://base.phoenixvtc.com/users/1'}
    //             ]
    //         })
    //
    //         this.handleUpdates()
    //     })
    // }

    // handleUpdates() {
    //     telemetry.game.on("connected", function () {
    //         rpc.setActivity({
    //             details: `🚛 Freeroaming`,
    //             startTimestamp,
    //             largeImageKey: 'logo_bg',
    //             buttons: [
    //                 {'label': 'Learn More', 'url': 'https://phoenixvtc.com'},
    //                 {'label': 'View Profile', 'url': 'https://base.phoenixvtc.com/users/1'}
    //             ]
    //         })
    //     })
    //
    //     telemetry.game.on("time-change", function () {
    //         const data = tst.getData()
    //
    //         checkMpInfo()
    //
    //         rpc.setActivity({
    //             details: `🚛 Freeroaming | ${data.truck.brand.name} ${data.truck.model.name}`,
    //             startTimestamp,
    //             largeImageKey: 'logo_bg',
    //             buttons: [
    //                 {'label': 'Learn More', 'url': 'https://phoenixvtc.com'},
    //                 {'label': 'View Profile', 'url': 'https://base.phoenixvtc.com/users/1'}
    //             ]
    //         })
    //     })
    //
    //     // Start watching the game for changes
    //     // ALWAYS at the bottom of the event listeners
    //     telemetry.watch()
    //
    //     function checkMpInfo() {
    //         // const info = {};
    //         const id = config.get('user').truckersmp_id
    //
    //         axios.get(`https://api.truckyapp.com/v2/map/onlineList?ids=${id}`).then((response) => {
    //             // Return if response is empty
    //             if (!response) {
    //                 return
    //             }
    //
    //             const data = response.data;
    //
    //             if (!data.response.players[0].online) {
    //                 console.log('OFFLINE');
    //             } else {
    //                 console.log('ONLINE')
    //             }
    //
    //             // Update the user data
    //             config.set('user', response.data)
    //         })
    //     }
    // }
}

module.exports = RichPresenceManager;
