import sdl from '@kmamal/sdl';
import path from 'path';
import Module from 'module';
import fs from 'fs';
import nrsc, { ImageData } from '@napi-rs/canvas';
import getOptions from './options.js';
import { initGamepads } from './gamepads.js';
import { createCanvas, OffscreenCanvas } from './canvas.js';
import { createImageClass, createLoadImage } from './image.js';
import createLocalStorage from './localstorage.js';
import initializeEvents from './events.js';
import { AudioContext, AudioDestinationNode, OscillatorNode, GainNode, AudioBuffer } from 'webaudio-node';
import createFetch from './fetch.js';
import createXMLHttpRequest from './xhr.js';


process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (err.code === 'EPIPE') {
    // console.log('EPIPE');
    // process.exit(0);
    return;
  }
  // Perform cleanup or logging here
  process.exit(1); // Optional: Exit the process gracefully
});

const internalLog = console.log.bind(console);
const internalError = console.error.bind(console);
console.log = (...args) => {
  try {
    internalLog(...args);
  } catch (e) {
    // do nothing
  }
}
console.error = (...args) => {
  try {
    internalError(...args);
  } catch (e) {
    // do nothing
  }
}

globalThis.global = globalThis;
console.log('LAUNCHING....');
// console.log('@napi-rs/canvas capabilities', Object.keys(nrsc));
// console.log('@kmamal/sdl capabilities', Object.keys(sdl));
let canvas;

globalThis.window = globalThis;
globalThis.HTMLCanvasElement = nrsc.Canvas;
globalThis.ImageData = ImageData;
globalThis.OffscreenCanvas = OffscreenCanvas;
const document = {
  getElementById: (id) => {
    // console.log('document.getElementById', id, canvas);
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
// web audio
globalThis.AudioContext = AudioContext;
globalThis.AudioDestinationNode = AudioDestinationNode;
globalThis.OscillatorNode = OscillatorNode;
globalThis.GainNode = GainNode;
globalThis.AudioBuffer = AudioBuffer;

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
// console.log('getting options...');

const options = getOptions();

// console.log('options', options);

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
  // console.log(Module.globalPaths);
}
console.log('creating rom specific globals', romDir);
globalThis.loadImage = createLoadImage(romDir);
globalThis.Image = createImageClass(romDir);
globalThis.fetch = createFetch(romDir);
globalThis.XMLHttpRequest = createXMLHttpRequest(romDir);
globalThis.localStorage = await createLocalStorage(romName);


let gameWidth = 640;
let gameHeight = 480;
let prevGameWidth = gameWidth;
let prevGameHeight = gameHeight;
let stride = 0;
let gameScale = 1;
let backCanvas;
let windowExp = false;
let appWindow;
let scaledGameWidth = 0;
let scaledGameHeight = 0;

const resize = () => {
  const { pixelWidth, pixelHeight } = appWindow;
  stride = pixelWidth * 4;
  backCanvas = createCanvas(pixelWidth, pixelHeight);
  const backCtx = backCanvas.getContext('2d');
  backCtx.imageSmoothingEnabled = false;
  backCtx.fillStyle = 'white';
  const fontSize = pixelWidth / 25;
  backCtx.font = `${fontSize}px Arial`;
  backCtx.fillText('Loading...', pixelWidth / 2 - fontSize * 5, pixelHeight / 2);
  appWindow.render(pixelWidth, pixelHeight, stride, 'rgba32', Buffer.from(backCanvas.data().buffer));
  // backCanvas = new Canvas(pixelWidth, pixelHeight);
  console.log('resize', pixelWidth, pixelHeight);
  backCanvas.name = 'backCanvas';
  scaledGameWidth = 0;
  scaledGameHeight = 0;
}


async function main() {
  const fullscreen = !!options.Fullscreen;
  console.log('fullscreen', fullscreen);
  appWindow = sdl.video.createWindow({ resizable: true, fullscreen });

  setTimeout(() => {
    appWindow.setTitle('canvas game');
    appWindow.setFullscreen(fullscreen);
    resize();
  }, 10);
  initializeEvents(appWindow);

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
  ctx.imageSmoothingEnabled = false;
  canvas.name = 'game canvas';

  await import(gameFile);

  let paintPosX = 0;
  let paintPosY = 0;
  let callCount = 0;
  let imageDrawTime = 0;
  let callbackTime = 0;
  let windowRenderTime = 0;

  function launcherDraw() {
    gameWidth = canvas.width;
    gameHeight = canvas.height;
  
    const { pixelWidth: windowWidth, pixelHeight: windowHeight } = appWindow;
    if (!backCanvas) {
      stride = windowWidth * 4;
      console.log('windowWidth', windowWidth, 'windowWidth', windowWidth);
      backCanvas = createCanvas(windowWidth, windowWidth);
    }
    const backCtx = backCanvas.getContext('2d');
    backCtx.imageSmoothingEnabled = false;
    
    if (!scaledGameWidth || prevGameWidth !== gameWidth || prevGameHeight !== gameHeight) {
      prevGameWidth = gameWidth;
      prevGameHeight = gameHeight;
      if ((windowWidth >= gameWidth ) && (windowHeight >= gameHeight)) {
        // find max multiple of width and height that fits in window
        const xScale = Math.floor(windowWidth / canvas.width);
        const yScale = Math.floor(windowHeight / canvas.height);
        gameScale = Math.min(xScale, yScale);
        scaledGameWidth = gameWidth * gameScale;
        scaledGameHeight = gameHeight * gameScale;
        paintPosX = (windowWidth - scaledGameWidth) / 2;
        paintPosY = (windowHeight - scaledGameHeight) / 2;
        backCtx.strokeStyle = 'white';
        backCtx.lineWidth = 1;
        backCtx.imageSmoothingEnabled = false;
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
      console.log(callCount / 5, 'FPS',
        'window.WxH', backCanvas.width, backCanvas.height,
        'drawImage', Number(imageDrawTime / callCount).toFixed(5),
        'game stretched', scaledGameWidth, scaledGameHeight,
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
  }, 5000);
}

main();
