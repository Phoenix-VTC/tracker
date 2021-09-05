module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            mainProcessWatch: ['src/managers/RichPresenceManager.js', 'src/managers/TelemetryManager.js'],
            builderOptions: {
                appId: 'com.phoenixvtc.tracker'
            }
        }
    }
}
