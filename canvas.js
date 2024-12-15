import { createCanvas as npcc } from '@napi-rs/canvas';

export function createCanvas(width, height) {
  const canvas = npcc(width, height);
  const baseGetContext = canvas.getContext.bind(canvas);
  let ctx;
  canvas.getContext = function getContext(type) {
    // TODO handle webgl
    if (!ctx) {
      ctx = baseGetContext(type);
      const baseDrawImage = ctx.drawImage.bind(ctx);
      ctx.drawImage = (image, ...args) => {
        if (image) {
          if (image._imgImpl) {
            baseDrawImage(image._imgImpl, ...args);
          } else {
            baseDrawImage(image, ...args);
          }
        }
      };
    }
    
    return ctx;
  }
  return canvas;
}

export class OffscreenCanvas {
  constructor(width, height) {
    return createCanvas(width, height);
  }
}
