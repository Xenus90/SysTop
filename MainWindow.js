const { BrowserWindow } = require("electron");

class MainWindows extends BrowserWindow {
    constructor(file, isDev) {
        super({
            title: "SysTop",
            width: isDev ? 800 : 355,
            height: 500,
            icon: "./assets/icons/icon.png",
            resizable: isDev ? true : false,
            show: false,
            opacity: 0.9,
            webPreferences: { nodeIntegration: true },
        });

        this.loadFile(file);
    }
}

module.exports = MainWindows;
