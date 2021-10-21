const tst = require('trucksim-telemetry')
const config = require('electron-cfg')
const axios = require('axios').default
const log = require('electron-log');
const TMLog = log.scope('telemetry-manager');

const endpointUrl = getApiEndpointUrl()

class TelemetryManager {
    constructor() {
        this.telemetry = tst()
    }

    init() {
        this.telemetry.job.on('started', function () {
            TMLog.verbose('Job started');

            sendData()
        })

        this.telemetry.game.on('time-change', function () {
            sendData()
        })

        this.telemetry.job.on('delivered', function () {
            TMLog.verbose('Job delivered');

            sendData()
        })

        this.telemetry.job.on('finished', function () {
            TMLog.verbose('Job finished');

            sendData()
        })

        this.telemetry.job.on('cancelled', function () {
            TMLog.verbose('Job cancelled');

            sendData()
        })

        // Start watching the game for changes
        this.telemetry.watch()

        function sendData() {
            TMLog.verbose('Sending telemetry data to Base');

            const data = tst.getData()

            axios.post(`${endpointUrl}/tracker`, JSON.stringify(data), {
                headers: {
                    'Authorization': `Bearer ${config.get('tracker-token')}`
                }
            }).catch(function (error) {
                TMLog.error(error)
            })
        }
    }
}

function getApiEndpointUrl() {
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

    return apiEndpointUrl + '/api';
}

module.exports = TelemetryManager;
