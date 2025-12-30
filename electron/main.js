const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

// Debug logging
const logPath = path.join(app.getPath('logs') || os.homedir(), 'youtube-to-markdown-debug.log');

function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

let mainWindow;
let backendProcess;

function createWindow() {
    logToFile('Creating window...');
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // In development, you might want to load the Vite dev server
    // mainWindow.loadURL('http://localhost:5173'); 

    // In production (built app), load the built index.html
    // Adjust the path to where your frontend/dist ends up relative to this file
    const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../frontend/dist/index.html')}`;
    logToFile(`Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startBackend() {
    let backendPath;
    let backendCwd;

    logToFile(`App isPackaged: ${app.isPackaged}`);
    logToFile(`Resources Path: ${process.resourcesPath}`);

    if (app.isPackaged) {
        // In production, unpacked files are in resources/app.asar.unpacked
        // process.resourcesPath points to Contents/Resources
        const unpackedPath = path.join(process.resourcesPath, 'app.asar.unpacked');
        backendPath = path.join(unpackedPath, 'backend', 'src', 'server.js');
        backendCwd = path.join(unpackedPath, 'backend');
    } else {
        // In development
        backendPath = path.join(__dirname, '../backend/src/server.js');
        backendCwd = path.join(__dirname, '../backend');
    }

    logToFile(`Backend Path: ${backendPath}`);
    logToFile(`Backend CWD: ${backendCwd}`);

    // Check if file exists
    if (!fs.existsSync(backendPath)) {
        logToFile('CRITICAL: Backend file does not exist at path!');
    }

    // Use the Electron binary itself as the Node executable
    // This ensures the app works even if the user doesn't have Node installed
    try {
        backendProcess = spawn(process.execPath, [backendPath], {
            cwd: backendCwd,
            env: { ...process.env, ELECTRON_RUN_AS_NODE: 1, PORT: 3001 }
        });

        backendProcess.stdout.on('data', (data) => {
            logToFile(`Backend STDOUT: ${data}`);
            console.log(`Backend: ${data}`);
        });

        backendProcess.stderr.on('data', (data) => {
            logToFile(`Backend STDERR: ${data}`);
            console.error(`Backend Error: ${data}`);
        });

        backendProcess.on('error', (err) => {
            logToFile(`Backend Process Error: ${err.message}`);
        });

        backendProcess.on('close', (code) => {
            logToFile(`Backend Process Exited with code: ${code}`);
        });

    } catch (e) {
        logToFile(`Failed to spawn backend: ${e.message}`);
    }
}


app.on('ready', () => {
    startBackend();
    // Give backend a moment to start
    setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

app.on('will-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
