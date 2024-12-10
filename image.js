import path from 'path';
import { loadImage, Image as CanvasImage } from '@napi-rs/canvas';

function getFinalUrl(gamePath, url) {
  let finalUrl;
  let testUrl = url.toLowerCase();
  if (testUrl.startsWith('http://')
    || testUrl.startsWith('https://')
    || testUrl.startsWith('data:')
    || testUrl.startsWith('blob:')
    || testUrl.startsWith('//')) {
    finalUrl = url;
  } else {
    finalUrl = path.join(gamePath, url);
  }
  console.log('loading image url:', url, 'finalUrl:', finalUrl);
  return finalUrl;
}

export function createImageClass(gamePath) {
  class Image extends CanvasImage {
    constructor() {
      this.width = 0;
      this.height = 0;
      this.naturalWidth = 0;
      this.naturalHeight = 0;
      this.complete = false;
    }
    set src(url) {
      const finalUrl = getFinalUrl(gamePath, url);
      super.src = finalUrl;
    }
  }
  return Image;
}

export function createLoadImage(gamePath) {
  return (url) => {
    const finalUrl = getFinalUrl(gamePath, url);
    return loadImage(finalUrl);
  };
}
