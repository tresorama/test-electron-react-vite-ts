import appLogo from './assets/images/logo.svg';
import './App.css';
import { ReactEventHandler, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import type { ExposedAPI } from '../../electron/renderer/renderer-react-preload.types';

// Augment native File type
type FileWithPath = File & { path: string; };

// Get exposed API from "preload" script in "main" side of electron
const _exposedAPI: ExposedAPI = (window as any).exposedAPI;


const useToast = () => {
  const domNodeRef = useRef<HTMLDivElement>(null);
  const Component = <div ref={domNodeRef} id="toast" className="toast">Toast message here</div>;
  return {
    Component,
    createToast(type: 'info' | 'error' | 'success', message: string) {
      const node = domNodeRef.current;
      if (!node) return;
      node.innerText = message ?? '---';
      node.style.backgroundColor = {
        info: 'white',
        error: 'red',
        success: 'green',
      }[type];
      node.style.color = {
        info: 'black',
        error: 'white',
        success: 'white',
      }[type];
      node.style.display = 'block';
      setTimeout(() => {
        node.style.display = 'none';
        node.innerText = '';
      }, 5000);
    }
  };
};

export default function App() {
  // Local State
  const outputDirPath = `C:\\Users\\brad\\imageshrink`; // _exposedAPI.osHomeDirPath + "/Downloads";
  const [selectedFile, setSelectedFile] = useState<FileWithPath | null>(null);
  const [selectedFileInfo, setSelectedFileInfo] = useState<null | {
    filename: string,
    w: number,
    h: number,
  }>(null);
  useEffect(() => {
    (async function extractFileInfo() {
      // clear file info if empty
      if (!selectedFile) {
        setSelectedFileInfo(null);
        return;
      }
      // get image file infos...
      async function getImageOriginalSizes(file: File) {
        const image = new Image();
        image.src = URL.createObjectURL(file);
        return new Promise<{
          width: number,
          height: number;
        }>(resolve => {
          image.onload = () => resolve({
            width: image.width,
            height: image.height,
          });
        });
      }
      const imageSize = await getImageOriginalSizes(selectedFile);
      setSelectedFileInfo({
        filename: selectedFile.name,
        w: imageSize.width,
        h: imageSize.height,
      });
    })();
  }, [selectedFile]);

  // UI components
  const toast = useToast();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const domNodeRef_outputW = useRef<HTMLInputElement>(null);
  const domNodeRef_outputH = useRef<HTMLInputElement>(null);

  // Events Listeners
  const onImageChange: ReactEventHandler<HTMLInputElement> = async (e) => {
    // get files selected by hte user in the file input...
    const input = e.currentTarget;
    const files = input.files;
    if (!files) return;
    const file = files[0];

    // ensure that they are images and not other files
    function isImage(file: File) {
      const acceptedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      return acceptedImageTypes.includes(file.type);
    }
    if (!isImage(file)) {
      toast.createToast('error', `File ${file.name} is NOT an image. Plase select an image!`);
      setIsFormVisible(false);// nodes.form.style.display = 'none';
      setSelectedFile(null);//nodes.imageSelectorWrapper.classList.remove('image-selector--image-is-selected');
      return;
    }

    // save local state
    setSelectedFile(file as FileWithPath);

    // show form and show input file data...
    setIsFormVisible(true);

  };
  const onFormSubmit: ReactEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    // validate the form before submitting...
    const outputW = domNodeRef_outputW.current?.value;
    const outputH = domNodeRef_outputH.current?.value;

    if (!outputH && !outputW) {
      toast.createToast('error', "Please insert \"width\" or \"height\". ");
      return;
    }
    if (outputH && outputW) {
      toast.createToast('error', "Please fill only one of \"width\" or \"height\". Not both! ");
      return;
    }

    // form data is valid. Submit ...
    if (!selectedFile) return;
    if (!selectedFileInfo) return;
    const isSuccess = await _exposedAPI.resizeImage({
      inputFilePath: selectedFile.path,
      inputW: String(selectedFileInfo.w),
      inputH: String(selectedFileInfo.h),
      outputW: outputW ?? '',
      outputH: outputH ?? '',
    });

    if (isSuccess) toast.createToast('success', "Successfully created!");
    else toast.createToast('error', "Error!");
  };

  return (
    <>
      {toast.Component}
      <div className="app-shell">
        {/* App Shell Header */}
        <div className="app-shell__header">
          <div className="window-header">
            <h1>
              <strong>Secure version</strong>
              <br />
              Has NOT direct access to Node APIs.
              It use "preload.js" and "contextBridge" to receive a limited exposed API.
            </h1>
          </div>
        </div>
        {/* App Shell Content */}
        <div className="app-shell__content">
          <div className="max-w-xl m-auto flex flex-col align-center justify-center">
            {/* Image Selector */}
            <div className={cx("image-selector", {
              "image-selector--image-is-selected": Boolean(selectedFile)
            })}>
              <div className="flex flex-col w-full items-center justify-center bg-grey-lighter">
                <label
                  className="w-64 flex flex-col items-center px-4 py-7 bg-white text-gray-500 rounded-lg shadow-lg tracking-wide uppercase border border-blue cursor-pointer hover:text-teal-800">
                  <img src={appLogo} width="32" />
                  <span className="mt-2 leading-normal">Select an image to resize</span>
                  <input onChange={onImageChange} id="img" type="file" className="hidden" />
                </label>
              </div>
              <div id="original-image-info" className="original-image-info">
                <p className="original-image-info__title">Original Image Info</p>
                {selectedFileInfo && (
                  <div className="original-image-info__data">
                    <span>Width</span>
                    <span>{selectedFileInfo.w}</span>
                    <span>Height</span>
                    <span>{selectedFileInfo.h}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Form */}
            {isFormVisible && (
              <form onSubmit={onFormSubmit} id="img-form">
                <div className="mt-6">
                  <label className="mt-1 block text-white text-center w-80 m-auto py-3 shadow-sm border-gray-300 rounded-md">Width</label>
                  <input
                    ref={domNodeRef_outputW}
                    type="number"
                    name="width"
                    id="width"
                    className="mt-1 block w-80 m-auto p-3 shadow-sm border-gray-300 rounded-md"
                    placeholder="Width"
                    defaultValue={selectedFileInfo?.w}
                  />
                </div>

                <div className="mt-4">
                  <label className="mt-1 block text-white text-center w-80 m-auto py-3 shadow-sm border-gray-300 rounded-md">Height</label>
                  <input
                    ref={domNodeRef_outputH}
                    type="number"
                    name="height"
                    id="height"
                    className="mt-1 block w-80 m-auto p-3 shadow-sm border-gray-300 rounded-md"
                    placeholder="Height"
                    defaultValue={selectedFileInfo?.h}
                  />
                </div>

                {/* Button */}
                <div className="mt-6">
                  <button
                    type="submit"
                    className="w-80 m-auto flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-500 hover:bg-teal-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Resize
                  </button>
                </div>
              </form>
            )}

            <p className="text-white text-lg text-center font-mono mt-6">
              <strong>File: </strong><span id="filename">{selectedFileInfo?.filename ?? ''}</span>
            </p>
            {/* Delete hardcoded path */}
            <p className="text-white text-lg text-center font-mono mt-2">
              <strong>Output: </strong>
              <span id="output-path">{outputDirPath}</span>
            </p>
          </div>
        </div>
      </div>
    </>
  );

}

