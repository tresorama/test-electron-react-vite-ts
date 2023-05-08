# Test Electron

Educational test of Electron.

## Overview

`Main` refer to the Node side , so "backend", that has acces to Node APIs.  
`Renderer` refers to the Chromium side, so "frontend".  

### Main

`main/main.js` in the entry point of the "main" side.
Here you can make Node.js operations.
Here you must bootstrap "renderer" windows.
A "renderer" window can be a local html file, or a remote url.

### Renderer

Every window of the app is a `BrowserWindow` (this step is done in "main" side).
You can exposed some "main" code into the window in several ways (with different security levels):
- Insecure - directly expose the Node environment into window, so it can use "require" and have semi-full access to Node APIs. To enable this pass 

```js
const w = new BrowserWindow({
  // ... rest
  webPreferences: {
    nodeIntegration: true,
    contextIsolation: false,
  }
});
w.loadFile("/path/to/renderer-file.html");
```
- Secure - you expose only what you need by creating a `preload` script, that has acces to both "main" and "renderer" envs (so it can `require` node modules), and expose a global object attached to "renderer" `window` js object.
```js
// main.js
const { BrowserWindow, ipcMain } = require('electron');
const { resizeImage } = require('./side-effects/resize-image');

const w = new BrowserWindow({
    width: IS_DEVELOPMENT ? 1000 : 700,
    height: 600,
    webPreferences: {
      preload: resolvePathFromRoot('./renderer/js/renderer-secure-preload.js')
    }
});

ipcMain.handle('ui--image-resize-submit', (e, payload) => {
  // code here in a Node env...
  const isSuccess = resizeImage(payload);
  return isSuccess;
});


// preload.js
const { contextBridge, ipcRenderer } = require('electron');

/** @typedef {import('../../main/side-effects/resize-image').ResizeImageParam} ResizeImageParam */
/** @typedef {import('../../main/side-effects/resize-image').ResizeImageReturnedValue} ResizeImageReturnedValue */

/**
 * @typedef ExposedAPI
 * @type {object}
 * @property {(options: ResizeImageParam ) => Promise<ResizeImageReturnedValue>} resizeImage 
 */

/** @type {ExposedAPI} */
const exposedAPI = {
  resizeImage: (payload) => ipcRenderer.invoke('ui--image-resize-submit', payload),
};

contextBridge.exposeInMainWorld('exposedAPI', exposedAPI);

// renderer.js
// Import JSDoc types
/** @typedef {import('./renderer-secure-preload').ExposedAPI} ExposedAPI */

// Get the exposed API from the "main" process
// This object is exposed inside "preload"
/** @type {ExposedAPI} */
const _exposedAPI = window.exposedAPI;

document.querySelector('#my-element').addEventListener('click', async (e) => {

  const isSuccess = await _exposedAPI.resizeImage({
    inputFilePath: selectedFile.path,
    outputW: nodes.widthInput.value,
    outputH: nodes.heightInput.value,
  });

  if (isSuccess) toast.createToast('success', "Successfully created!");
  else toast.createToast('error', "Error!");
});
```
