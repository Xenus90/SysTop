const path = require("path");
const { app, BrowserWindow, Menu, ipcMain, Tray } = require("electron");
const Store = require("./Store");
const MainWindow = require("./MainWindow");

process.env.NODE_ENV = "production";
const isDev = process.env.NODE_ENV !== "production" ? true : false;
const isMac = process.platform === "darwin" ? true : false;

let mainWindow;
let tray;

const store = new Store({
    configName: "user-settings",
    defaults: {
        settings: {
            cpuOverload: 80,
            alertFrequency: 5,
        }
    }
});

function createMainWindow() {
    mainWindow = new MainWindow("./app/index.html", isDev);
}

app.on("ready", () => {
    createMainWindow();

    mainWindow.webContents.on("dom-ready", () => {
        mainWindow.webContents.send("settings:get", store.get("settings"));
    });

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    tray = new Tray(path.join(__dirname, "assets", "icons", "tray_icon.png"));
    tray.setToolTip("SysTop");
    tray.on("click", () => mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show());
    tray.on("right-click", () => {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: "Quit",
                click: () => {
                    app.isQuitting = true;
                    app.quit();
                },
            },
        ]);

        tray.popUpContextMenu(contextMenu);
    });

    mainWindow.on("close", e => {
        if (!app.isQuitting) {
            e.preventDefault();
            mainWindow.hide();
        }

        return true;
    });

    mainWindow.on("ready", () => mainWindow = null);
});

app.on("window-all-closed", () => {
    if (!isMac) {
        app.quit();
    }
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
    }
});

ipcMain.on("settings:set", (e, value) => {
    store.set("settings", value);
    mainWindow.webContents.send("settings:get", store.get("settings"));
});

const menu = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
        role: "fileMenu",
    },
    {
        label: "View",
        submenu: [
            {
                label: "Toggle Navigation",
                click: () => mainWindow.webContents.send("nav:toggle"),
            }
        ]
    },
    ...(isDev
        ? [
              {
                  label: "Developer",
                  submenu: [{ role: "reload" }, { role: "forcereload" }, { type: "separator" }, { role: "toggledevtools" }],
              },
          ]
        : []),
];
