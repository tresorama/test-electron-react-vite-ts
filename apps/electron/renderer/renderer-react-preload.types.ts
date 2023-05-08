import { ResizeImageParam, ResizeImageReturnedValue } from "../main/side-effects/resize-image.types";

export type ExposedAPI = {
  osHomeDirPath: string,
  resizeImage: (payload: ResizeImageParam) => Promise<ResizeImageReturnedValue>;
};