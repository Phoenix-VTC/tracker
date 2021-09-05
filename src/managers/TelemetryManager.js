const tst = require("trucksim-telemetry")

const config = require('electron-cfg')

const axios = require('axios').default

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

            axios.post('http://base.test/api/tracker', JSON.stringify(data), {
                headers: {
                    'Authorization': `Bearer ${Buffer.from(config.get('tracker-token')).toString('base64')}`
                }
            }).catch(function (error) {
                console.log(error)
            })
        }
    }
}

module.exports = TelemetryManager;
