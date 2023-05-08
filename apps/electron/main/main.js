const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const { resizeImage } = require('./side-effects/resize-image');

// Define some constants based on current running environment/machine
const REACT_APP_DEVELOPEMNT_URL = "http://localhost:5173";
const REACT_APP_PRODUCTION_FILE_PATH = `file://${path.join(__dirname, '../../', 'renderer-react', 'dist', 'index.html')}`;
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const isMac = process.platform === 'darwin';

// Define some utils
/** @type {(endingPath:string) => string} */
const resolvePathFromRoot = (endingPath) => path.resolve(__dirname, "../", endingPath);

// ======================
// Start Here!
// ======================

// handle creation of "windows" of app
function createMainSecureWindow() {
  const w = new BrowserWindow({
    width: IS_DEVELOPMENT ? 1000 : 700,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      preload: resolvePathFromRoot('./renderer/renderer-react-preload.js'),
    }
  });

  // simulateProd: {
  //   console.log(REACT_APP_PRODUCTION_FILE_PATH);
  //   w.loadURL(REACT_APP_PRODUCTION_FILE_PATH);
  //   return;
  // }

  if (IS_DEVELOPMENT) {
    // If we are in development mode we load content from localhost server - vite
    w.loadURL(REACT_APP_DEVELOPEMNT_URL).catch(console.error);
    // and open the developer tools
    w.webContents.openDevTools();
  } else {
    // In all other cases, load the index.html file from the dist folder
    w.loadURL(REACT_APP_PRODUCTION_FILE_PATH).catch(console.error);
  }

}
function createAboutWindow() {
  const w = new BrowserWindow({
    width: 300,
    height: 600
  });

  w.loadFile(resolvePathFromRoot("./renderer/screens/about/about.html"))
    .catch(console.error);
}
// handle creation of app menu in the OS status bar (top of the screen when app is focused)
function implementAppMenu() {
  /** @type {import('electron').MenuItemConstructorOptions[]} */
  const menu = [
    ...(isMac ? [
      {
        label: app.name, submenu: [
          { label: 'About', click: createAboutWindow },
          { label: 'Quit', click: app.quit }
        ]
      },
    ] : []),
    {
      label: 'File', submenu: [
        { label: 'Quit', click: app.quit }
      ]
    }
  ];

  const mainMenu = Menu.buildFromTemplate(menu);
  Menu.setApplicationMenu(mainMenu);

}


// 1. When the app starts and is ready...
app.whenReady().then(() => {
  // Create the Main Windows of this App
  createMainSecureWindow();

  // Create the Menu
  // tht appear in the OS status bar (top of the screen when app is focused)
  // implementAppMenu();

  // In macOS apps generally continue running even without any windows open.
  // Activating the app when no windows are available should open a new one
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainSecureWindow();
    }
  });
});


// When all "windows" of the app are closed...
app.on('window-all-closed', () => {
  // on Mac do nothing because is typical to do that!
  if (isMac) return;

  // quit the app (close completely)
  app.quit();

});


// 2. Register event listeners
// These events will be triggered by the "renderer" windows (UI)
ipcMain.handle('ui--image-resize-submit', (e, payload) => {
  const isSuccess = resizeImage(payload);
  return isSuccess;
});