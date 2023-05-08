const { contextBridge, ipcRenderer } = require('electron');
const os = require('os');

/** @typedef {import('../../../main/side-effects/resize-image').ResizeImageParam} ResizeImageParam */
/** @typedef {import('../../../main/side-effects/resize-image').ResizeImageReturnedValue} ResizeImageReturnedValue */

/**
 * @typedef ExposedAPI
 * @type {object}
 * @property {string} osHomeDirPath 
 * @property {(options: ResizeImageParam ) => Promise<ResizeImageReturnedValue>} resizeImage 
 */

/** @type {ExposedAPI} */
const exposedAPI = {
  osHomeDirPath: os.homedir(),
  resizeImage: (payload) => ipcRenderer.invoke('ui--image-resize-submit', payload),
};

contextBridge.exposeInMainWorld('exposedAPI', exposedAPI);