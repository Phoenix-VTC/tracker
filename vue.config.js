module.exports = {
    pluginOptions: {
        electronBuilder: {
            nodeIntegration: true,
            mainProcessWatch: ['src/managers/RichPresenceManager.js', 'src/managers/TelemetryManager.js', 'src/managers/InstallationManager.js'],
            builderOptions: {
                productName: 'Phoenix Tracker',
                appId: 'com.phoenixvtc.tracker',
                nsis: {
                    oneClick: false,
                    perMachine: true,
                    menuCategory: true,
                },
                extraResources: [
                    {
                        from: "node_modules/regedit/vbs",
                        to: "regedit/vbs",
                        filter: [
                            "**/*"
                        ]
                    }
                ]
            }
        }
    }
}
