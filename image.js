import path from 'path';
import { loadImage as canvasLoadImage, Image } from '@napi-rs/canvas';

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
  console.log('getFinalUrl:', url, 'finalUrl:', finalUrl);
  return finalUrl;
}

export function createLoadImage(gamePath) {
  console.log('createLoadImage', gamePath);
  return (url, force) => {
    console.log('loadImage...', gamePath, url, force);
    let finalUrl = url;
    if (!force) {
      finalUrl = getFinalUrl(gamePath, url);
    }
    return canvasLoadImage(finalUrl);
  };
}

export function createImageClass(gamePath) {
  class Image {
    constructor(width, height) {
      this._width = width || 0;
      this._height = height || 0;
      this._src = '';
    }
    set src(url) {
      const finalUrl = getFinalUrl(gamePath, url);
      this._src = finalUrl;
      canvasLoadImage(finalUrl).then((image) => {
        this._width = image.width;
        this._height = image.height;
        this._imgImpl = image;
        if (this.onload) {
          this.onload(this);
        }
      }).catch((error) => {
        if (this.onerror) {
          this.onerror(error);
        }
      });
    }
    get src() {
      return this._src;
    }
    get width() {
      if (this._imgImpl) {
        return this._imgImpl.width;
      }
      return this._width;
    }
    get height() {
      if (this._imgImpl) {
        return this._imgImpl.height;
      }
      return this._height;
    }
    get complete() {
      return !!this._imgImpl;
    }
  }

  return Image;
}

