module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            mainProcessWatch: ['src/RichPresenceManager.js', 'src/TelemetryManager.js'],
        }
    }
}
