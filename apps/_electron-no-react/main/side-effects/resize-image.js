const { shell } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const resizeImg = require('resize-img');


/** @typedef {{inputFilePath:string, inputW:string, inputH:string, outputW: string, outputH: string}} ResizeImageParam */
/** @typedef {boolean} ResizeImageReturnedValue */
/** @type  {(payload: ResizeImageParam ) => ResizeImageReturnedValue} */
module.exports.resizeImage = async (payload) => {
  try {
    const { inputFilePath, inputW, inputH, outputW, outputH } = payload;

    // calculate options of the resize process
    const outputSizes = (() => {
      const inputImageSizeRatio = Number(inputW) / Number(inputH);// w/h
      const round = (num) => Math.round(num);

      // if user provided a new "width"...
      if (outputW) {
        return {
          w: round(Number(outputW)),
          h: round(Number(outputW) / inputImageSizeRatio),
        };
      }
      // if user provided a new "height"...
      if (outputH) {
        return {
          w: round(Number(outputH) * inputImageSizeRatio),
          h: round(Number(outputH)),
        };
      }
    })();

    // calculate file name stuff
    const inputDirPath = path.dirname(inputFilePath);
    const inputFileName = path.basename(inputFilePath);
    const inputFileExt = path.extname(inputFilePath);
    const inputFileNameWithoutExtension = inputFileName.split(inputFileExt)[0];
    const resizeSuffix = `${outputSizes.w}x${outputSizes.h}`;
    const outputFileName = `${inputFileNameWithoutExtension}-${resizeSuffix}-${inputFileExt}`;
    const homeDirPath = os.homedir();
    const outputFilePath = path.join(homeDirPath, "Downloads", outputFileName);
    console.log({
      payload,
      outputSizes,
      outputFileName,
      outputFilePath,
    });

    // create new resized image an write to a file on disk
    const imageBuffer = await resizeImg(
      fs.readFileSync(inputFilePath),
      {
        width: outputSizes.w,
        height: outputSizes.h,
      }
    );
    fs.writeFileSync(outputFilePath, imageBuffer);

    // open Finder/Explorer to image path
    shell.showItemInFolder(outputFilePath);
    console.log('reszieImage - Success');
    return true;
  } catch (error) {
    console.log('reszieImage - Error');
    console.error(error);
    return false;
  }
};
