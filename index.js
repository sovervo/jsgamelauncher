import sdl from '@kmamal/sdl';
import path from 'path';
import Module from 'module';
import XMLHttpRequest from 'xhr-shim';
import fs from 'fs';
import nrsc, { createCanvas, ImageData } from '@napi-rs/canvas';
import getOptions from './options.js';
import { initGamepads } from './gamepads.js';
import { createImageClass, createLoadImage } from './image.js';
import createLocalStorage from './localstorage.js';
import initializeEvents from './events.js';

globalThis.global = globalThis;


console.log('nrsc', Object.keys(nrsc));
let canvas;

globalThis.window = globalThis;
globalThis.HTMLCanvasElement = nrsc.Canvas;
globalThis.ImageData = ImageData;
class OffscreenCanvas {
  constructor(width, height) {
    return createCanvas(width, height);
  }
}
globalThis.OffscreenCanvas = OffscreenCanvas;
const document = {
  getElementById: (id) => {
    console.log('document.getElementById', id, canvas);
    return canvas;
  },
  createElement: (name) => {
    if (name === 'canvas') {
      return canvas;
    }
    return {};
  },
  body: {
    appendChild: () => {},
  },
  documentElement: {},
  readyState: 'complete',
};
globalThis.document = document;
globalThis.screen = {};
globalThis.XMLHttpRequest = XMLHttpRequest;


console.log('sdl', Object.keys(sdl));

// globalThis.loadImage = loadImage;
globalThis.sdl = sdl;

let rafCallbackId = 1;
// let rafCallbacks = [];
let currentRafCallback;

function requestAnimationFrame(callback) {
  rafCallbackId++;
  currentRafCallback = {
    id: rafCallbackId,
    callback,
  };
  // console.log('requestAnimationFrame add:', rafCallbackId);
  return rafCallbackId;
};

function cancelAnimationFrame(id) {
  if (currentRafCallback?.id === id) {
    currentRafCallback = null;
  }
};


globalThis.requestAnimationFrame = requestAnimationFrame;
globalThis.cancelAnimationFrame = cancelAnimationFrame;
console.log('getting options...');


const options = getOptions();

console.log('options', options);

const romFile = options.Rom;
const romDir = path.dirname(romFile);
const gameFile = path.join(romDir, 'game.js');
console.log('gameFile', gameFile);
const romName = path.basename(romDir);
console.log('options', options, 'romFile', romFile, 'romDir', romDir, 'romName', romName);
// console.log('args', process.argv);

// console.log(Module.globalPaths);
if (fs.existsSync(path.join(romDir, 'node_modules'))) {
  Module.globalPaths.push(path.join(romDir, 'node_modules'));
  console.log(Module.globalPaths);
}
// globalThis.Image = createImageClass(romDir);
globalThis.loadImage = createLoadImage(romDir);

const gameWidth = 640;
const gameHeight = 480;
let stride = 0;
let gameScale = 1;
let backCanvas;


async function main() {
  globalThis.localStorage = await createLocalStorage(romName);
  globalThis.Image = createImageClass(romDir);
  const fullscreen = !!options.Fullscreen;
  console.log('fullscreen', fullscreen);
  const appWindow = sdl.video.createWindow({ resizable: true, fullscreen });
  appWindow.setTitle('canvas game');
  initializeEvents(appWindow);
  setTimeout(() => {
    resize();
    appWindow.setFullscreen(fullscreen);
  }, 100);

  canvas = createCanvas(gameWidth, gameHeight);
  if (!canvas.addEventListener) {
    canvas.addEventListener = (a, b, c) => {
      console.log('canvas.addEventListener', a, b, c);
    };
  }
  if (!canvas.removeEventListener) {
    canvas.removeEventListener = (a, b, c) => {
      console.log('canvas.removeEventListener', a, b, c);
    };
  }
  if (!canvas.getBoundingClientRect) {
    canvas.getBoundingClientRect = () => {
      return {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      };
    };
  }
  // let canvas = new Canvas(gameWidth, gameHeight);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  canvas.name = 'game canvas';


  await import(gameFile);

  let paintPosX = 0;
  let paintPosY = 0;
  let scaledGameWidth = 0;
  let scaledGameHeight = 0;
  let scale = 1;
  let callCount = 0;
  let imageDataTime = 0;
  let imageDrawTime = 0;
  let callbackTime = 0;
  let windowRenderTime = 0;
  let bufferCreateTime = 0;

  function launcherDraw() {
  
    const { pixelWidth: windowWidth, pixelHeight: windowHeight } = appWindow;
    if (!backCanvas) {
      stride = windowWidth * 4;
      console.log('windowWidth', windowWidth, 'windowWidth', windowWidth);
      backCanvas = createCanvas(windowWidth, windowWidth);
      // backCanvas = new Canvas(windowWidth, windowHeight);
    }
    const backCtx = backCanvas.getContext('2d');
    backCtx.imageSmoothingEnabled = false;
    // const buffer = Buffer.from(canvas.data);
    
    if (!scaledGameWidth) {
      if ((windowWidth >= gameWidth ) && (windowHeight >= gameHeight)) {
        // find max mulitple of width and height that fits in window
        const xScale = Math.floor(windowWidth / canvas.width);
        const yScale = Math.floor(windowHeight / canvas.height);
        gameScale = Math.min(xScale, yScale);
        scaledGameWidth = gameWidth * gameScale;
        scaledGameHeight = gameHeight * gameScale;
        paintPosX = (windowWidth - scaledGameWidth) / 2;
        paintPosY = (windowHeight - scaledGameHeight) / 2;
        // console.log('scale', scale, paintPosX, paintPosY);
        backCtx.strokeStyle = 'white';
        backCtx.lineWidth = 1;
        backCtx.imageSmoothingEnabled = false;
        backCtx.strokeRect(paintPosX, paintPosY, scaledGameWidth, scaledGameHeight);
      }
    }
    
    // backCtx.drawIntegerScaled(canvas, paintPosX, paintPosY, gameScale);
    const startImageDrawTime = performance.now();
    backCtx.drawImage(canvas, paintPosX, paintPosY, scaledGameWidth, scaledGameHeight);
    imageDrawTime+= (performance.now() - startImageDrawTime);
    // console.log('backCanvas paint x,y', paintPosX, paintPosY, 'backCanvas w, h', backCanvas.width, backCanvas.height, 'scaled game w, h', scaledGameWidth, scaledGameHeight,'scale', gameScale);
    if (windowWidth < canvas.width || windowHeight < canvas.height) {
      console.log('NOT rednering to window', windowWidth, windowHeight, backCanvas.data.length, scale, paintPosX, paintPosY);
      const tempBackCanvas = createCanvas(windowWidth, windowHeight);
      stride = tempBackCanvas.width * 4;
      const tempBackCtx = tempBackCanvas.getContext('2d');
      window.render(tempBackCanvas.width, tempBackCanvas.height, stride, 'rgba32', Buffer.from(tempBackCtx.getImageData(0, 0, tempBackCanvas.width, tempBackCanvas.height).data));
      return;
    }
    const startImageDataTime = performance.now();
    const imageData = backCtx.getImageData(0, 0, backCanvas.width, backCanvas.height);
    imageDataTime+= (performance.now() - startImageDataTime);
    
    const startBufferCreateTime = performance.now();
    // console.log('imagedata', imageData.data.buffer);
    const buffer = Buffer.from(imageData.data.buffer);
    bufferCreateTime+= (performance.now() - startBufferCreateTime);

    const startWindowRenderTime = performance.now();
    appWindow.render(backCanvas.width, backCanvas.height, stride, 'rgba32', buffer);
    windowRenderTime+= (performance.now() - startWindowRenderTime);
  }

  appWindow.on('close', () => {
    console.log('window closed');
    process.exit(0);
  });


  const resize = () => {
    const { pixelWidth, pixelHeight } = appWindow;
    stride = pixelWidth * 4;
    backCanvas = createCanvas(pixelWidth, pixelHeight);
    // backCanvas = new Canvas(pixelWidth, pixelHeight);
    console.log('resize', pixelWidth, pixelHeight);
    backCanvas.name = 'backCanvas';
    scaledGameWidth = 0;
    scaledGameHeight = 0;
  }
  
  appWindow
    .on('resize', resize)
    .on('expose', resize)


  
  let lastTime = performance.now();
  function launcherLoop() {
    callCount++;
    const gamepads = globalThis.navigator.getGamepads();
    if (gamepads[0]) {
      if (gamepads[0].buttons[16].pressed && gamepads[0].buttons[9].pressed) {
        console.log('exit button pressed', gamepads[0].buttons[16], gamepads[0].buttons[9]);
        console.log('EXITING');
        process.exit(0);
      }
    }


    // console.log('currentRafCallback', currentRafCallback);
    const callbackStartTime = performance.now();
    if (currentRafCallback) {
      const currentTime = performance.now();
      let thisCallback = currentRafCallback;
      currentRafCallback = null;
      thisCallback.callback(currentTime - lastTime);
      lastTime = currentTime;
    }
    callbackTime+= (performance.now() - callbackStartTime);

    launcherDraw();
    setImmediate(launcherLoop);
  }
  
  initGamepads();
  launcherLoop();

  // Log the FPS (calls per second)
  setInterval(() => {
    console.log(`${callCount} calls per second`,
      backCanvas.width,
      backCanvas.height,
      'imagedata', imageDataTime / callCount,
      'imagedrawtime', imageDrawTime / callCount,
      'game callback', callbackTime / callCount,
      'window render', windowRenderTime / callCount,
      'buffercreate' , bufferCreateTime / callCount,
    );
    callCount = 0; // Reset the counter
    imageDataTime = 0;
    imageDrawTime = 0;
    callbackTime = 0;
    windowRenderTime = 0;
    bufferCreateTime = 0;
  }, 1000);

}

main();


