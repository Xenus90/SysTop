const path = require("path");
const { ipcRenderer } = require("electron");
const osu = require("node-os-utils");

const cpu = osu.cpu;
const mem = osu.mem;
const os = osu.os;

let cpuOverload;
let alertFrequency;

ipcRenderer.on("settings:get", (e, settings) => {
    cpuOverload = +settings.cpuOverload;
    alertFrequency = +settings.alertFrequency;
});

document.getElementById("cpu-model").innerHTML = cpu.model();
document.getElementById("comp-name").innerHTML = os.hostname();
document.getElementById("os").innerHTML = `${os.type()} ${os.arch()}`;
mem.info().then((info) => (document.getElementById("mem-total").innerHTML = `${info.totalMemMb} Mb`));

setInterval(() => {
    cpu.usage().then((info) => {
        document.getElementById("cpu-usage").innerHTML = `${info} %`;
        document.getElementById("cpu-progress").style.width = info + "%";

        if (info >= cpuOverload) {
            document.getElementById("cpu-progress").style.background = "red";
        } else {
            document.getElementById("cpu-progress").style.background = "#30c88b";
        }

        if (info >= cpuOverload && runNotify(alertFrequency)) {
            notifyUser({
                title: "CPU overload",
                body: `CPU is over: ${cpuOverload} %`,
                icon: path.join(__dirname, "../", "assets", "icons", "icon.png"),
            });

            localStorage.setItem("lastNotify", +(new Date()));
        }
    });
    cpu.free().then((info) => (document.getElementById("cpu-free").innerHTML = `${info} %`));
    document.getElementById("sys-uptime").innerHTML = secondsToDHMS(os.uptime());
}, 2000);

function secondsToDHMS(seconds) {
    seconds = +seconds;

    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d, ${hours}h, ${minutes}m, ${secs}s`;
}

function notifyUser(options) {
    new Notification(options.title, options);
}

function runNotify(alertFrequency) {
    if (localStorage.getItem("lastNotify") === null) {
        localStorage.setItem("lastNotify", +(new Date()));
        return true;
    }

    const notifyTime = new Date(parseInt(localStorage.getItem("lastNotify")));
    const now = new Date();
    const difference = Math.abs(now - notifyTime);
    const minutesPassed = Math.ceil(difference / (1000 * 60));

    if (minutesPassed > alertFrequency) {
        return true;
    } else {
        return false;
    }
}
