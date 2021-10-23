'use strict'

import {
    app,
    protocol,
    BrowserWindow,
    Menu,
    MenuItem,
    ipcMain,
    shell,
    dialog,
} from 'electron'
import {createProtocol} from 'vue-cli-plugin-electron-builder/lib'
import installExtension, {VUEJS3_DEVTOOLS} from 'electron-devtools-installer'

const isDevelopment = process.env.NODE_ENV !== 'production'
const config = require('electron-cfg')
const axios = require('axios').default
const RichPresenceManager = require('./managers/RichPresenceManager')
const TelemetryManager = require('./managers/TelemetryManager')
const InstallationManager = require('./managers/InstallationManager')
const installationManager = new InstallationManager()
const AutoLaunch = require('auto-launch');
const log = require('electron-log');
const BGLog = log.scope('background');
const fs = require('fs');
require('@electron/remote/main').initialize()
import defaultMenu from 'electron-default-menu';
import {autoUpdater} from 'electron-updater';
import {spawn} from 'child_process';

let mainWindow

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    {scheme: 'app', privileges: {secure: true, standard: true}}
])

axios.interceptors.response.use((response) => response, (error) => {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        BGLog.error(error.response.data);
        BGLog.error(error.response.status);
        BGLog.error(error.response.headers);
    } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        BGLog.error(error.request);
    } else {
        // Something happened in setting up the request that triggered an Error
        BGLog.error('Error', error.message);
    }
    BGLog.log(error.config);

    throw error;
});

function createWindow() {
    // Create the browser window.
    let win = new BrowserWindow({
        width: 1220,
        height: 780,
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

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        win.loadURL('app://./index.html')

        autoUpdater.checkForUpdatesAndNotify().catch((error) => {
            BGLog.error('checkForUpdatesAndNotify error: ' + error)
        })
    }

    // Remove the old log file
    removeLogFile();

    // Create the application menu
    createApplicationMenu();

    // Start the installation manager
    installationManager.init(win)

    // Open target="_blank" links in default browser instead of a new window in the Electron app
    win.webContents.on('new-window', function (e, url) {
        e.preventDefault();
        require('electron').shell.openExternal(url);
    });

    return win;
}

function removeLogFile() {
    try {
        const path = log.transports.file.getFile().path;

        fs.unlinkSync(path);
    } catch(err) {
        BGLog.error(err);
    }
}

function createApplicationMenu() {
    // Get default menu template
    const menu = defaultMenu(app, shell);

    // Add settings menu
    menu.splice(3, 0, new MenuItem(
        {
            label: 'Settings',
            submenu: [
                {
                    label: 'Reset installation status',
                    click() {
                        installationManager.resetInstallationStatus(mainWindow);
                    }
                },
                {
                    label: 'Change game paths',
                    submenu: [
                        {
                            label: 'TruckersMP',
                            click() {
                                installationManager.changeTruckersMpPath(mainWindow);
                            }
                        },
                        {
                            label: 'Euro Truck Simulator 2',
                            click() {
                                installationManager.changeEts2Path(mainWindow);
                            }
                        },
                        {
                            label: 'American Truck Simulator',
                            click() {
                                installationManager.changeAtsPath(mainWindow);
                            }
                        }
                    ]
                },
                {
                    label: 'Logout',
                    click() {
                        logout();
                    }
                },
            ]
        }
    ))

    // Replace help menu
    menu.splice(4, 1, new MenuItem(
        {
            label: 'Help',
            submenu: [
                {
                    label: 'PhoenixBase',
                    click() {
                        shell.openExternal('https://base.phoenixvtc.com')
                    }
                },
                {
                    label: 'Phoenix Discord',
                    click() {
                        shell.openExternal('https://discord.gg/PhoenixVTC')
                    }
                }
            ]
        }
    ))

    Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
}

function logout() {
    dialog.showMessageBox(mainWindow, {
        type: 'question',
        title: 'Logout',
        message: 'Are you sure that you want to log out?',
        buttons: ['Yes', 'No'],
        defaultId: 1,
    }).then(res => {
        // Return if 2nd button was clicked
        if (res.response === 1) {
            return;
        }

        config.delete('tracker-token');
        config.delete('user');

        app.relaunch();
        app.exit();
    });
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
            BGLog.error('Vue Devtools failed to install: ' + e.toString())
        }
    }

    await updateUserData()

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

    axios.get(`${getEndpointUrl(true)}/user`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }).catch(function () {
        BGLog.info('updateUserData request returned an error, deleting used data.')

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
    event.returnValue = getEndpointUrl(true);
})

ipcMain.on('get-phoenixbase-url', (event) => {
    event.returnValue = getEndpointUrl();
})

function getEndpointUrl(api = false) {
    let endpointUrl = '';

    const endpoint = config.get('api-endpoint', 'production');

    switch (endpoint) {
        case 'staging':
            endpointUrl = 'https://base-staging.phoenixvtc.com';
            break;
        case 'local':
            endpointUrl = 'http://base.test';
            break;
        default:
            endpointUrl = 'https://base.phoenixvtc.com'
    }

    if (api) {
        return endpointUrl + '/api';
    }

    return endpointUrl;
}

ipcMain.on('launch-ets2', (event) => {
    if (process.arch === 'x64') {
        launchGame(`${config.get('ets2-path')}\\bin\\win_x64\\eurotrucks2.exe`);
    } else {
        launchGame(`${config.get('ets2-path')}\\bin\\win_x86\\eurotrucks2.exe`);
    }

    event.returnValue = true;
})

ipcMain.on('launch-truckersmp', (event) => {
    launchGame(`${config.get('truckersmp-path')}\\launcher.exe`);

    event.returnValue = true;
})

ipcMain.on('launch-ats', (event) => {
    if (process.arch === 'x64') {
        launchGame(`${config.get('ats-path')}\\bin\\win_x64\\amtrucks.exe`);
    } else {
        launchGame(`${config.get('ats-path')}\\bin\\win_x86\\amtrucks.exe`);
    }

    event.returnValue = true;
})

function launchGame(executablePath) {
    spawn(executablePath, {detached: true});
}

const autoLauncher = new AutoLaunch({
    name: 'Phoenix Tracker',
    isHidden: true,
});

ipcMain.on('toggle-start-on-boot', (event) => {
    autoLauncher.isEnabled()
        .then(function (isEnabled) {
            if (isEnabled) {
                autoLauncher.disable();
                BGLog.info('Start on boot disabled');

                return;
            }
            autoLauncher.enable();
            BGLog.info('Start on boot enabled');
        })
        .catch(function (err) {
            console.log(err)
            BGLog.error(err)
        });

    event.returnValue = true;
})

ipcMain.on('starts-on-boot', (event) => {
    autoLauncher.isEnabled()
        .then(function (isEnabled) {
            event.returnValue = isEnabled;
        });
})
