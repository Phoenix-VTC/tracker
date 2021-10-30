module.exports = {
    productionSourceMap: false,
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
                ],
                publish: {
                    provider: "s3",
                    bucket: "phoenixvtc-tracker-updates",
                    region: "nl-ams",
                    acl: "public-read",
                    endpoint: "https://phoenixvtc-tracker-updates.s3.nl-ams.scw.cloud",
                }
            }
        }
    }
}
