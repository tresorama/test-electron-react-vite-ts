export type ResizeImageParam = {
  inputFilePath: string,
  inputW: string,
  inputH: string,
  outputW: string,
  outputH: string,
};
export type ResizeImageReturnedValue = boolean;

export type ResizeImage = (payload: ResizeImageParam) => Promise<ResizeImageReturnedValue>;