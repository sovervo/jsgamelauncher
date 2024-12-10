const sdlToWebKeys = {
  ctrl: 'Control',
  shift: 'Shift',
  alt: 'Alt',
  meta: 'Meta',
  space: ' ',
  enter: 'Enter',
  escape: 'Escape',
  backspace: 'Backspace',
  tab: 'Tab',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
}

function getWinEvent(type, e) {
  const evt = {
    type,
    key: sdlToWebKeys[e.key] || e.key,
    code: e.key,
    repeat: e.repeat,
    altKey: e.alt,
    ctrlKey: e.ctrl,
    shiftKey: e.shift,
  };
  return evt;
}

export default function initialize(appWindow) {
  globalThis.document = globalThis.document || {};
  let keyDownListeners = [];
  let keyUpListeners = [];

  appWindow.on('keyDown', (e) => {
    keyDownListeners.forEach((listener) => {
      const evt = getWinEvent('keydown', e);
      listener(evt);
    });
  });
  appWindow.on('keyUp', (e) => {
    keyUpListeners.forEach((listener) => {
      const evt = getWinEvent('keyup', e);
      listener(evt);
    });
  });

  globalThis.addEventListener = function (type, listener) {
    if (type === 'keydown') {
      keyDownListeners.push(listener);
    } else if (type === 'keyup') {
      keyUpListeners.push(listener);
    }
  };

  globalThis.document.addEventListener = globalThis.addEventListener;

  globalThis.removeEventListener = function (type, listener) {
    if (type === 'keydown') {
      keyDownListeners = keyDownListeners.filter((l) => l !== listener);
    } else if (type === 'keyup') {
      keyUpListeners = keyUpListeners.filter((l) => l !== listener);
    }
  }

  globalThis.document.removeEventListener = globalThis.removeEventListener;

}
