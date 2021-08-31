const clientId = '823583866702921739';
const DiscordRPC = require('discord-rpc')

class RichPresenceManager {
    init() {
        const rpc = new DiscordRPC.Client({transport: 'ipc'});
        const startTimestamp = new Date();

        rpc.on('ready', () => {
            rpc.setActivity({
                details: 'Game not running',
                startTimestamp,
                largeImageKey: 'logo_bg',
                buttons: [
                    {'label': 'Learn More', 'url': 'https://phoenixvtc.com'},
                    {'label': 'View Profile', 'url': 'https://base.phoenixvtc.com/users/1'}
                ]
            });
        });

        rpc.login({clientId}).catch(console.error);
    }
}

module.exports = RichPresenceManager;
