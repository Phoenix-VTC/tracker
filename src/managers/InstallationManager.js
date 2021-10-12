const config = require('electron-cfg');
const Downloader = require('nodejs-file-downloader');
const {app, dialog} = require('electron');

class InstallationManager {
    constructor() {
        console.log('Installation Manager')
    }

    async init(mainWindow) {
        this.mainWindow = mainWindow;
        let installedGames = [];

        // Return if the installation has already been completed before.
        if (config.get('installation-completed', false) === true) {
            return;
        }

        // Return if in development environment because regedit doesn't work with that.
        if (this.isDev()) {
            return;
        }

        // Ask the user if they want to start the setup
        const startSetup = await dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Tracker setup',
            message: 'Do you want to start the initial tracker setup?\nIf not, you can always manually trigger the installation from the top menu.',
            buttons: ['Yes', 'No'],
            defaultId: 1,
        });

        // Return if they don't
        if (startSetup.response === 1) {
            config.set('installation-completed', true);

            return;
        }

        // Define regedit, and set the external VBS location (see https://github.com/ironSource/node-regedit/issues/60)
        let regedit = require('regedit');
        regedit.setExternalVBSLocation('resources/regedit/vbs');

        // Get and save the TruckersMP path
        const truckersMpData = await regedit.promisified.list('HKLM\\SOFTWARE\\TruckersMP')
        const truckersMpPath = truckersMpData['HKLM\\SOFTWARE\\TruckersMP']['values']['InstallDir']['value'];
        config.set('truckersmp-path', truckersMpPath)

        // ETS2
        const ets2Path = truckersMpData['HKLM\\SOFTWARE\\TruckersMP']['values']['InstallLocationETS2']['value'];
        if (typeof ets2Path !== 'undefined') {
            // Save the ETS2 path
            config.set('ets2-path', ets2Path)

            // Push game to the installedGames array
            installedGames.push('ETS2')

            // Install the telemetry for ETS
            await this.installTelemetry(ets2Path)
        }

        // ATS
        const atsPath = truckersMpData['HKLM\\SOFTWARE\\TruckersMP']['values']['InstallLocationATS']['value'];
        if (typeof atsPath !== 'undefined') {
            // Save the ATS path
            config.set('ats-path', atsPath)

            // Push game to the installedGames array
            installedGames.push('ATS')

            // Install the telemetry for ATS
            await this.installTelemetry(atsPath)
        }

        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Success!',
            message: `Telemetry successfully installed for ${installedGames.join(' and ')}!`,
        })

        config.set('installation-completed', true);
    }

    resetInstallationStatus(mainWindow) {
        dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Reset installation status',
            message: 'Are you sure that you want to reset the tracker installation status?',
            buttons: ['Yes', 'No'],
            defaultId: 1,
        }).then(res => {
            // Set the ATS directory to null if the 2nd button was clicked
            if (res.response === 1) {
                return;
            }

            config.delete('installation-completed');

            dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Installation status reset!',
                message: 'Installation status reset!\nThe tracker will now restart.',
            }).then(() => {
                app.relaunch();
                app.exit();
            })
        });
    }

    changeTruckersMpPath(mainWindow) {
        let truckersMpPath = config.get('truckersmp-path');

        dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Change TruckersMP path',
            message: `The TruckersMP installation path is currently set to: ${truckersMpPath}\n\nDo you want to change it?`,
            buttons: ['Yes', 'No'],
            defaultId: 1,
        }).then(res => {
            if (res.response === 0) {
                dialog.showOpenDialog({
                        properties: ['openDirectory'],
                        title: 'Select your TruckersMP installation path',
                        defaultPath: truckersMpPath,
                    }
                ).then(async res => {
                    if (res.filePaths[0] === undefined) {
                        return
                    }

                    let path = res.filePaths[0];
                    config.set('truckersmp-path', path)

                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'Success!',
                        message: 'TruckersMP installation path successfully changed!',
                    })
                })
            }
        });
    }

    changeEts2Path(mainWindow) {
        let ets2Path = config.get('ets2-path');

        dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Change ETS2 game path',
            message: `The ETS2 game path is currently set to: ${ets2Path}\n\nDo you want to change it?`,
            buttons: ['Yes', 'No'],
            defaultId: 1,
        }).then(res => {
            if (res.response === 0) {
                dialog.showOpenDialog({
                        properties: ['openDirectory'],
                        title: 'Select your ETS2 game path',
                        defaultPath: ets2Path,
                    }
                ).then(async res => {
                    if (res.filePaths[0] === undefined) {
                        return
                    }

                    let path = res.filePaths[0];
                    config.set('ets2-path', path)

                    await this.installTelemetry(path)

                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'Success!',
                        message: 'ETS2 game path successfully changed, and telemetry (re)installed!',
                    })
                })
            }
        });
    }

    changeAtsPath(mainWindow) {
        let atsPath = config.get('ats-path');

        dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Change ATS game path',
            message: `The ATS game path is currently set to: ${atsPath}\n\nDo you want to change it?`,
            buttons: ['Yes', 'No'],
            defaultId: 1,
        }).then(res => {
            if (res.response === 0) {
                dialog.showOpenDialog({
                        properties: ['openDirectory'],
                        title: 'Select your ATS game path',
                        defaultPath: atsPath,
                    }
                ).then(async res => {
                    if (res.filePaths[0] === undefined) {
                        return
                    }

                    let path = res.filePaths[0];
                    config.set('ats-path', path)

                    await this.installTelemetry(path)

                    dialog.showMessageBox(mainWindow, {
                        type: 'info',
                        title: 'Success!',
                        message: 'ATS game path successfully changed, and telemetry (re)installed!',
                    })
                })
            }
        });
    }

    async installTelemetry(path) {
        const download64 = new Downloader({
            url: 'https://github.com/Phoenix-VTC/scs-sdk/raw/main/Win64/scs-telemetry.dll',
            directory: `${path}/bin/win_x64/plugins`,
            fileName: 'phoenix-telemetry.dll',
            cloneFiles: false // Overwrite the file
        })
        await download64.download();

        const download32 = new Downloader({
            url: 'https://github.com/Phoenix-VTC/scs-sdk/raw/main/Win32/scs-telemetry.dll',
            directory: `${path}/bin/win_x86/plugins`,
            fileName: 'phoenix-telemetry.dll',
            cloneFiles: false // Overwrite the file
        })
        await download32.download();
    }

    isDev() {
        return process.mainModule.filename.indexOf('app.asar') === -1;
    }
}

module.exports = InstallationManager;
