const clientId = '823583866702921739'
const DiscordRPC = require('discord-rpc')
const tst = require('trucksim-telemetry')
const config = require('electron-cfg')
const configFile = require('../config')
const util = require('util');
const axios = require('axios').default;
const log = require('electron-log');
const RPMLog = log.scope('rich-presence-manager');

class RichPresenceManager {
    constructor() {
        this.telemetry = tst();

        // setting initial variables state
        this.rpc = null;

        this.mpInfo = null
        this.lastData = null
        this.rpcReady = false
        this.rpcOnChangingState = false
        this.locationCheckerInterval = null
        this.locationInfo = null
    }

    init() {
        const instance = this;

        if (!config.get('user')) {
            RPMLog.warn('Exiting, user is not signed in.');

            return;
        }

        // Return if the connected user doesn't have a TruckersMP ID
        if (typeof config.get('user').truckersmp_id === 'undefined') {
            RPMLog.warn('Exiting, user does not have a TMP ID connected.');

            return;
        }

        this.telemetry.game.on('disconnected', function () {
            RPMLog.verbose('Disconnected from game');

            instance.resetTelemetryData();
            instance.resetRPCClient();
        });

        this.telemetry.watch({interval: 5000}, update)

        // Begin to initialize Discord RPC
        // checking if is in valid state
        if (!instance.rpcOnChangingState) {

            // checking if is not ready
            if (!instance.rpcReady) {

                instance.rpcOnChangingState = true;

                instance.timestamp = Date.now()

                if (instance.mpInfo && !instance.mpInfo.online) {
                    instance.checkLocationInfo();
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

        function update(data) {
            RPMLog.verbose('Updating');

            // Use a try / catch as sometimes the data isn't there when first connecting. Also because of JSON parsing
            try {
                // Set apart the last data received
                instance.lastData = data;

                if (instance.rpcReady) {
                    // checking if playing in multiplayer and loading online state, server and position
                    if (!instance.TRUCKYERROR) {
                        instance.checkMpInfo();
                    }

                    const activity = instance.buildActivity(data);

                    if (activity != null) {
                        instance.rpc.setActivity(activity);
                    }
                }
            } catch (error) {
                RPMLog.error(error);
            }
        }

        // Check if game is running (outputting data)
        // If not, display the game not running RPC status & clear the telemetry data.
        setInterval(function () {
            const data = tst.getData()

            if (data === null) {
                instance.resetTelemetryData();
                instance.resetRPCClient();
            }

        }, 10000);
    }

    resetTelemetryData() {
        RPMLog.verbose('Resetting telemetry data');

        this.lastData = null;
        this.mpInfo = null;
        this.mpStatsInfo = null;
        this.locationInfo = null;
    }

    checkMpInfo() {
        const instance = this;

        RPMLog.verbose('Checking multiplayer info');

        if (this.lastData != null) {
            axios.get(`${getBaseUrl()}/api/tracker/resolve-truckersmp-player-data`, {
                headers: {
                    'Authorization': `Bearer ${config.get('tracker-token')}`
                },
                params: {
                    ids: config.get('user').truckersmp_id
                }
            })
                .then(function (response) {
                    response = response.data;
                    if (response.error === false) {
                        instance.mpInfo = {
                            online: true,
                            server: response.server,
                            apiserverid: response.server.id,
                            playerid: response.data.player_id,
                            mod: response.server.mod
                        };
                        instance.locationInfo = {
                            location: response.near.city,
                            inCity: false // TODO: Deprecated, remove this
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

                        instance.checkLocationInfo();
                    }
                })
                .catch(function (error) {
                    instance.mpInfo = null;
                    instance.TRUCKYERROR = true;

                    RPMLog.error('Trucky API is currently having issues - MP Checker has been stopped.');
                    RPMLog.error(error);
                });
        }
    }

    checkLocationInfo() {
        const instance = this;

        RPMLog.verbose('Checking location info');

        if (this.lastData.truck.position.X === 0) {
            instance.locationInfo = {
                location: false,
                inCity: null,
            };
        } else {
            axios.get(`${getBaseUrl()}/api/tracker/resolve-location`, {
                headers: {
                    'Authorization': `Bearer ${config.get('tracker-token')}`
                },
                params: {
                    game: this.lastData.game.game.name,
                    x: this.lastData.truck.position.X,
                    y: this.lastData.truck.position.Z
                }
            }).then((response) => {
                response = response.data;
                if (response.error === false) {
                    instance.locationInfo = {
                        location: response.near.city,
                        inCity: false, // TODO: Deprecated, remove this
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

        RPMLog.verbose('Building RPC activity');

        if (config.get('enable-discord-rpc', true) === false) {
            this.rpc.clearActivity();
            return;
        }

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

        if (data.job.income > 0) {
            if (!data.job.isSpecial) {
                activity.details += `🚚 ${data.job.source.city.name} > ${data.job.destination.city.name} | ${data.truck.make.name} ${data.truck.model.name}`;
            } else {
                activity.details += `🚧 Special Transport | ${data.truck.make.name} ${data.truck.model.name}`
            }
        } else {
            if (data.game.paused) {
                activity.details += `🕗 Game paused`
            } else {
                activity.details += `🚛 Freeroaming | ${data.truck.make.name} ${data.truck.model.name}`;
            }
        }

        if (!data.game.paused && data.truck.engine.enabled === true) {
            activity.details += util.format(` at ${this.calculateSpeed(speed, this.isAts(data))}${this.getSpeedUnit(this.isAts(data))}`);
        }

        activity.largeImageText = 'Phoenix Tracker';
        activity.largeImageKey = 'logo_bg';

        if (this.mpInfo != null && this.mpInfo.online) {
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
            {'label': 'View Profile', 'url': `${getBaseUrl()}/users/${config.get('user').id}`},
            {'label': 'Learn More', 'url': 'https://phoenixvtc.com'}
        ]

        return activity;
    }

    isAts(data) {
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
        RPMLog.verbose('Resetting RPC');

        if (config.get('enable-game-not-running-discord-rpc', false) === false || config.get('user') === null) {
            this.rpc.clearActivity();
            return;
        }

        if (this.rpc === null) {
            return;
        }

        this.rpc.setActivity({
            details: 'Game not running',
            startTimestamp: this.timestamp,
            largeImageKey: 'logo_bg',
            buttons: [
                {'label': 'View Profile', 'url': `${getBaseUrl()}/users/${config.get('user').id}`},
                {'label': 'Learn More', 'url': 'https://phoenixvtc.com'}
            ]
        })
    }
}

// TODO: Convert to ipcRenderer.sendSync('get-phoenixbase-url')
function getBaseUrl() {
    let apiEndpointUrl = '';

    const endpoint = config.get('api-endpoint', 'production');

    switch (endpoint) {
        case 'staging':
            apiEndpointUrl = 'https://base-staging.phoenixvtc.com';
            break;
        case 'local':
            apiEndpointUrl = 'http://base.test';
            break;
        default:
            apiEndpointUrl = 'https://base.phoenixvtc.com'
    }

    return apiEndpointUrl;
}

module.exports = RichPresenceManager;
