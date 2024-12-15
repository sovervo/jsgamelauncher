import sdl from '@kmamal/sdl';
import path from 'path';
import Module from 'module';
import XMLHttpRequest from 'xhr-shim';
import fs from 'fs';
import nrsc, { ImageData } from '@napi-rs/canvas';
import getOptions from './options.js';
import { initGamepads } from './gamepads.js';
import { createCanvas, OffscreenCanvas } from './canvas.js';
import { createImageClass, createLoadImage } from './image.js';
import createLocalStorage from './localstorage.js';
import initializeEvents from './events.js';

globalThis.global = globalThis;
console.log('@napi-rs/canvas capabilities', Object.keys(nrsc));
console.log('@kmamal/sdl capabilities', Object.keys(sdl));
let canvas;

globalThis.window = globalThis;
globalThis.HTMLCanvasElement = nrsc.Canvas;
globalThis.ImageData = ImageData;
globalThis.OffscreenCanvas = OffscreenCanvas;
const document = {
  getElementById: (id) => {
    console.log('document.getElementById', id, canvas);
    return canvas;
  },
  createElement: (name) => {
    if (name === 'canvas') {
      return createCanvas(300, 150);
    }
    if (name === 'image' && globalThis.Image) {
      return new globalThis.Image();
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

globalThis.sdl = sdl;

let rafCallbackId = 1;
let currentRafCallback;

function requestAnimationFrame(callback) {
  rafCallbackId++;
  currentRafCallback = {
    id: rafCallbackId,
    callback,
  };
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
let gameFile;
const tryOrder = [
  ['game.js'],
  ['src', 'game.js'],
  ['index.js'],
  ['src', 'index.js'],
  ['main.js'],
  ['src', 'main.js'],
]
for (const order of tryOrder) {
  const tryGameFile = path.join(romDir, ...order);
  if (fs.existsSync(tryGameFile)) {
    gameFile = tryGameFile;
    break;
  }
}
if (!gameFile) {
  console.error('game.js file not found');
  process.exit(1);
}

console.log('gameFile', gameFile);
const romName = path.basename(romDir);
console.log('options', options, 'gameFile', gameFile, 'romDir', romDir, 'romName', romName);

if (fs.existsSync(path.join(romDir, 'node_modules'))) {
  Module.globalPaths.push(path.join(romDir, 'node_modules'));
  console.log(Module.globalPaths);
}
globalThis.loadImage = createLoadImage(romDir);
globalThis.Image = createImageClass(romDir);
glot

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
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  canvas.name = 'game canvas';


  await import(gameFile);

  let paintPosX = 0;
  let paintPosY = 0;
  let scaledGameWidth = 0;
  let scaledGameHeight = 0;
  let callCount = 0;
  let imageDrawTime = 0;
  let callbackTime = 0;
  let windowRenderTime = 0;

  function launcherDraw() {
  
    const { pixelWidth: windowWidth, pixelHeight: windowHeight } = appWindow;
    if (!backCanvas) {
      stride = windowWidth * 4;
      console.log('windowWidth', windowWidth, 'windowWidth', windowWidth);
      backCanvas = createCanvas(windowWidth, windowWidth);
    }
    const backCtx = backCanvas.getContext('2d');
    backCtx.imageSmoothingEnabled = true;
    
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
        backCtx.strokeStyle = 'white';
        backCtx.lineWidth = 1;
        backCtx.imageSmoothingEnabled = true;
        backCtx.strokeRect(paintPosX, paintPosY, scaledGameWidth, scaledGameHeight);
      }
    }
    
    const startImageDrawTime = performance.now();
    backCtx.drawImage(canvas, paintPosX, paintPosY, scaledGameWidth, scaledGameHeight);
    imageDrawTime+= (performance.now() - startImageDrawTime);
    if (windowWidth < canvas.width || windowHeight < canvas.height) {
      console.log('NOT rednering to window', windowWidth, windowHeight);
      return;
    }
    const buffer = Buffer.from(backCanvas.data().buffer);
    
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

  // Log the FPS (frames per second)
  setInterval(() => {
    // somtimes console.log throws an error ¯\_(ツ)_/¯
    try {
      console.log(callCount, 'FPS',
        'window.WxH', backCanvas.width, backCanvas.height,
        'drawImage', Number(imageDrawTime / callCount).toFixed(5),
        'game.callback', Number(callbackTime / callCount).toFixed(5),
        'game.scale', gameScale,
        'window.render', Number(windowRenderTime / callCount).toFixed(5),
      );
    } catch (e) {
      console.error(e);
    }
    // Reset the counters
    callCount = 0;
    imageDrawTime = 0;
    callbackTime = 0;
    windowRenderTime = 0;
  }, 1000);
}

main();
