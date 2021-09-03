module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            mainProcessWatch: ['src/RichPresenceManager.js', 'src/TelemetryManager.js'],
            builderOptions: {
                appId: 'com.phoenixvtc.tracker'
            }
        }
    }
}
