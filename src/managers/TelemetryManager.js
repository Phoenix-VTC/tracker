const tst = require('trucksim-telemetry')

const config = require('electron-cfg')

const axios = require('axios').default

const endpointUrl = getApiEndpointUrl()

class TelemetryManager {
    constructor() {
        this.telemetry = tst()
    }

    init() {
        console.log('Telemetry Manager')

        this.telemetry.job.on('started', function () {
            sendData()
        })

        this.telemetry.game.on('time-change', function () {
            sendData()
        })

        this.telemetry.job.on('delivered', function () {
            sendData()
        })

        this.telemetry.job.on('finished', function () {
            sendData()
        })

        this.telemetry.job.on('cancelled', function () {
            sendData()
        })

        // Start watching the game for changes
        this.telemetry.watch()

        function sendData() {
            const data = tst.getData()

            axios.post(`${endpointUrl}/tracker`, JSON.stringify(data), {
                headers: {
                    'Authorization': `Bearer ${config.get('tracker-token')}`
                }
            }).catch(function (error) {
                console.log(error)
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
