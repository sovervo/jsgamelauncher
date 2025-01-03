import { createCanvas as npcc } from '@napi-rs/canvas';

export function createCanvas(width, height) {
  const canvas = npcc(width, height);
  const baseGetContext = canvas.getContext.bind(canvas);
  let ctx;
  canvas.style = {};
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
  canvas.getBoundingClientRect = () => {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: canvas.width,
      bottom: canvas.height,
      width: canvas.width,
      height: canvas.height,
    };
  }
  canvas.parent = globalThis.document.body;
  globalThis.document.body._canvas = canvas;
  
  return canvas;
}

export class OffscreenCanvas {
  constructor(width, height) {
    return createCanvas(width, height);
  }
}
