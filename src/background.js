'use strict'

import {app, protocol, BrowserWindow, Tray, Menu, Notification, nativeImage, ipcMain} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'

const isDevelopment = process.env.NODE_ENV !== 'production'
const config = require('electron-cfg')
const axios = require('axios').default
const RichPresenceManager = require('./managers/RichPresenceManager')
const TelemetryManager = require('./managers/TelemetryManager')
const path = require('path')

let mainWindow

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {secure: true, standard: true}}
])

function createWindow() {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'Phoenix Tracker',
        icon: 'src/assets/icons/icon_256.ico',
        backgroundColor: '#161e2e',
        webPreferences: {
            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
            contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION
        }
    })

    let tray = null;

    win.on('minimize', function (event) {
        event.preventDefault();

        win.setSkipTaskbar(true);

        tray = createTray();

        new Notification({
            title: 'Phoenix Tracker minimized to tray',
            body: 'Double-click or right-click the icon to restore the window.'
        }).show()
    });

    win.on('restore', function () {
        win.show();
        win.setSkipTaskbar(false);
        tray.destroy();
    });

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        win.loadURL('app://./index.html')
    }

    return win;
}

function createTray() {

    let appIcon = new Tray(path.join(__static, 'favicon.ico'));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Phoenix Tracker',
            icon: nativeImage.createFromPath(path.join(__static, 'favicon.ico')).resize({width: 16}),
            enabled: false,
        },
        {
            type: 'separator',
        },
        {
            label: 'Show Tracker', click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    appIcon.on('double-click', function () {
        mainWindow.show();
    });

    appIcon.setToolTip('Phoenix Tracker');
    appIcon.setContextMenu(contextMenu);

    return appIcon;
}

app.whenReady().then(() => {
    mainWindow = createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            await installExtension(VUEJS3_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }

    await updateUserData()

    // mainWindow = createWindow();

    const telemetryManager = new TelemetryManager()
    telemetryManager.init()

    const presenceManager = new RichPresenceManager()
    presenceManager.init()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

function updateUserData() {
    const token = config.get('tracker-token')

    axios.get(`${getApiEndpointUrl()}/user`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).catch(function () {
        // Delete the tracker token and user if the request contained an error
        config.delete('tracker-token')
        config.delete('user')
    }).then((response) => {
        // Return if response is empty
        if (!response) {
            return
        }

        // Update the user data
        config.set('user', response.data)
    })
}

ipcMain.on('get-api-endpoint-url', (event) => {
    event.returnValue = getApiEndpointUrl();
})

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
