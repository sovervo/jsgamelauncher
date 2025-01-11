import sdl from '@kmamal/sdl';
import { createRequire } from 'module';
import parseCfg from './controllers/parse_cfg.js';
const require = createRequire(import.meta.url);

const controllerList = require('./controllers/db.json');
let additionalControllerList = [];


function getControllerDef(device) {
  let def;
  device.name = ('' + device.name).trim();
  console.log('getControllerDef', device.name, device.guid);

  // check additional controller list first
  const matchedAdditional = additionalControllerList.filter((c) => {
    // console.log('checking additional controller', c.guid, c.name);
    return (c.guid === device.guid) && (c.name === device.name);
  });
  // console.log('matchedAdditional? :', matchedAdditional);
  if (matchedAdditional?.length) {
    // console.log('matchedAdditional yes', matchedAdditional);
    // last (most recent) one on the list
    return matchedAdditional[matchedAdditional.length - 1];
  }

  const matchedGuids = controllerList.filter((c) => c.guid === device.guid);
  // console.log('matchedGuids? :', matchedGuids.length);
  if (matchedGuids.length > 0) {
    // console.log('matchedGuids', device.name, matchedGuids);
    const matchedGuidAndName = matchedGuids.filter((c) => c.name === device.name);
    // console.log('matchedGuidAndName', matchedGuidAndName);
    if (matchedGuidAndName.length === 1) {
      return matchedGuidAndName[0];
    }
    if (matchedGuidAndName.length > 1) {
      def = matchedGuidAndName[0];
      for (const c of matchedGuidAndName) {
        if (c.input.length > def.input.length) {
          def = c;
        }
      }
      return def;
    }
    def = matchedGuids[0];
    for (const c of matchedGuids) {
      if (c.input.length > def.input.length) {
        def = c;
      }
    }
    // console.log('matched def: ', def);
    return def;
  }
  const matchedNames = controllerList.filter((c) => c.name === device.name);
  // console.log('matchedNames? :', matchedNames.length);
  if (matchedNames.length > 0) {
    def = matchedNames[0];
    for (const c of matchedNames) {
      if (c.input.length > def.input.length) {
        def = c;
      }
    }
    return def;
  }
  // console.log('no matched names or guids', def);
  return def;
}

const AXIS_THRESHOLD = 0.11;

// for standard controller mappings, emulation station uses nintendo style button ids
const esButtonMap = {
  'b': 0,
  'a': 1,
  'y': 2,
  'x': 3,
  'pageup': 4,
  'pagedown': 5,
  'l2': 6,
  'r2': 7,
  'select': 8,
  'start': 9,
  'l3': 10,
  'r3': 11,
  'up': 12,
  'down': 13,
  'left': 14,
  'right': 15,
  'hotkey': 16,
}

function createJSMap(device) {
  const def = getControllerDef(device);
  console.log('createJSMap def', def);
  if (!def) {
    return;
  }
  const buttons = Array(17).fill(100);
  const axes = [];
  def.input.forEach((i) => {
    if (i.type === 'button') {
      const btnId = parseInt(i.id, 10);
      const btnStdId = esButtonMap[i.name];
      buttons[btnId] = btnStdId;
      // console.log('button', i.name, btnStdId, btnId);
    } else if (i.type === 'axis') {
      const id = parseInt(i.id, 10);
      if (!axes[id]) {
        axes[id] = [];
      }
      axes[id].push({
        id,
        name: i.name,
        value: parseInt(i.value, 10),
      });
    }
  });
  const JSMap = {
    buttons,
    axesHandler: (gp, e) => {
      const val = e.value;
      // gp.axes[e.axix] = e.value;
      const axesDefs = axes[e.axis];
      if (!axesDefs) {
        return;
      }
      for (const a of axesDefs) {
        switch (a.name) {
          case 'joystick1left':
            gp.axes[0] = val;
            break;
          case 'joystick1up':
            gp.axes[1] = val;
            break;
          case 'joystick2left':
            gp.axes[2] = val;
            break;
          case 'joystick2up':
            gp.axes[3] = val;
            break;
          case 'l2':
            gp.axes[5] = val;
            gp.buttons[6].value = (val + 1) / 2;
            gp.buttons[6].pressed = ((val + 1) / 2) > AXIS_THRESHOLD;
            break;
          case 'r2':
            gp.axes[6] = val;
            gp.buttons[7].value = (val + 1) / 2;
            gp.buttons[7].pressed = ((val + 1) / 2) > AXIS_THRESHOLD;
            break;
          case 'left':
            gp.axes[0] = val;
            gp.buttons[14].pressed = val < -AXIS_THRESHOLD;
            break;
          case 'right':
            gp.axes[0] = val;
            gp.buttons[15].pressed = val > AXIS_THRESHOLD;
            break;
          case 'up':
            gp.axes[1] = val;
            gp.buttons[12].pressed = val < -AXIS_THRESHOLD;
            break;
          case 'down':
            gp.axes[1] = val;
            gp.buttons[13].pressed = val > AXIS_THRESHOLD;
            break;
        }
      }
    },
    dbMatch: def,
  };
  return JSMap;
}

const { controller, joystick } = sdl;

// knulli doesn't want me to log to console.log for some reason
// console.log = console.error;

let gamepads = [];

if (!globalThis.navigator) {
  globalThis.navigator = {};
}
globalThis.navigator.getGamepads = () => {
  // console.log('get gamepads');
  return gamepads;
};

// translates from SDL2 gamepad controller button/axes names to browser standard gamepad button/axes indices
const stdGamepadMapping = {
  'a': 0, // south btn
  'b': 1, // east btn
  'x': 2, // west btn
  'y': 3, // north btn
  'leftShoulder': 4,
  'rightShoulder': 5,
  'leftTrigger': 6,
  'rightTrigger': 7,
  'back': 8, // select
  'start': 9,
  'leftStick': 10,
  'rightStick': 11,
  'dpadUp': 12,
  'dpadDown': 13,
  'dpadLeft': 14,
  'dpadRight': 15,
  'guide': 16,
  'leftStickX': 0,
  'leftStickY': 1,
  'rightStickX': 2,
  'rightStickY': 3,
  'leftTrigger': 4,
  'rightTrigger': 5,
};

// deeplay (RG35XXSP) joystick to browser standard gamepad button indices
const deeplayJSMap = {
  buttons: [
    100, // sdl_idx 0 , ?
    100, // sdl_idx 1 , ?
    100, // sdl_idx 2 , ?
    1, // sdl_idx 3 , b
    0, // sdl_idx 4 , a
    2, // sdl_idx 5 , x
    3, // sdl_idx 6 , y
    4, // sdl_idx 7 , left shoulder
    5, // sdl_idx 8 , right shoulder
    8, // sdl_idx 9 , select
    9, // sdl_idx 10 , start
    16, // sdl_idx 11 , guide
    6, // sdl_idx 12 , left trigger
    7, // sdl_idx 13 , right trigger
    16, // sdl_idx 14 , guide again?
  ],
}

// anbernic (RG40XXH) joystick to browser standard gamepad button indices
const anbernicJSMap = {
  buttons: [
    100, // sdl_idx 0 , ?
    100, // sdl_idx 1 , ?
    100, // sdl_idx 2 , ?
    1, // sdl_idx 3 , b
    0, // sdl_idx 4 , a
    2, // sdl_idx 5 , x
    3, // sdl_idx 6 , y
    4, // sdl_idx 7 , left shoulder
    5, // sdl_idx 8 , right shoulder
    8, // sdl_idx 9 , select
    9, // sdl_idx 10 , start
    16, // sdl_idx 11 , guide
    10, // sdl_idx 12 , left joystick (L3)
    6, // sdl_idx 13 , left trigger
    7, // sdl_idx 14 , right trigger
    11, // sdl_idx 15 , right joystick (R3)
  ],
}


// translate SDL2 std joystick button ids to browser standard gamepad button indices
const stdJoystickMapping = {
  buttons: [
    0, // sdl_idx 0 , a
    1, // sdl_idx 1 , b
    2, // sdl_idx 2 , x
    3, // sdl_idx 3 , y
    8, // sdl_idx 4 , back
    16, // sdl_idx 5 , guide
    9, // sdl_idx 6 , start
    10, // sdl_idx 7 , left stick
    11, // sdl_idx 8 , right stick
    4, // sdl_idx 9 , left shoulder
    5, // sdl_idx 10 , right shoulder
    12, // sdl_idx 11 , dpad up
    13, // sdl_idx 12 , dpad down
    14, // sdl_idx 13 , dpad left
    15, // sdl_idx 14 , dpad right
  ],
}

// xbox 360 "pad" knockoffs that SDL doesn't recognize as a controller
const xbox360JSMap = {
  buttons: [
    0, // sdl_idx 0 , a
    1, // sdl_idx 1 , b
    2, // sdl_idx 2 , x
    3, // sdl_idx 3 , y
    4, // sdl_idx 4 , left shoulder
    5, // sdl_idx 5 , right shoulder
    8, // sdl_idx 6 , select
    9, // sdl_idx 7 , start
    16, // sdl_idx 8 , guide
    10, // sdl_idx 9 , left joystick (L3)
    11, // sdl_idx 10 , right joystick (R3)
  ],
  axesHandler: (gp, e) => {
    let val;
    if (e.axis === 0 || e.axis === 1) {
      gp.axes[e.axis] = e.value;
    } else if (e.axis === 2) {
      gp.axes[4] = e.value;
      val = (e.value + 1) / 2;
      gp.buttons[6].value = val;
      gp.buttons[6].pressed = val > 0.11;
    } else if (e.axis === 3) {
      gp.axes[2] = e.value;
    } else if (e.axis === 4) {
      gp.axes[3] = e.value;
    } else if (e.axis === 5) {
      gp.axes[5] = e.value;
      val = (e.value + 1) / 2;
      gp.buttons[7].value = val;
      gp.buttons[7].pressed = val > 0.11;
    }
  },
};

// sony ps4 controller, not sure why SDL isn't mapping it as a controller
const sonyPS4JSMap = {
  buttons: [
    0, // sdl_idx 0 , a
    1, // sdl_idx 1 , b
    3, // sdl_idx 2 , x
    2, // sdl_idx 3 , y
    4, // sdl_idx 4 , left shoulder
    5, // sdl_idx 5 , right shoulder
    100, // sdl_idx 6 , mapped as digital l trigger?
    100, // sdl_idx 7 , mapped as digital r trigger?
    8, // sdl_idx 8 , select
    9, // sdl_idx 9 , start
    16, // sdl_idx 10 , guide
    10, // sdl_idx 11 , left trigger
    11, // sdl_idx 12 , right trigger
  ],
  axesHandler: (gp, e) => {
    let val;
    if (e.axis === 0 || e.axis === 1) {
      gp.axes[e.axis] = e.value;
    } else if (e.axis === 2) {
      gp.axes[4] = e.value;
      val = (e.value + 1) / 2;
      gp.buttons[6].value = val;
      gp.buttons[6].pressed = val > 0.11;
    } else if (e.axis === 3) {
      gp.axes[2] = e.value;
    } else if (e.axis === 4) {
      gp.axes[3] = e.value;
    } else if (e.axis === 5) {
      gp.axes[5] = e.value;
      val = (e.value + 1) / 2;
      gp.buttons[7].value = val;
      gp.buttons[7].pressed = val > 0.11;
    }
  },
};


function createGamepad(device, _sdltype) {
  // const def = getControllerDef(device);
  // console.log('def', JSON.stringify(def, null, 2));
  let _jsMap = createJSMap(device);
  if (!_jsMap) {
    const lcDev = String(device.name).toLowerCase();
    if (lcDev.startsWith('anbernic ') || ['deeplay-keys'].includes(lcDev)) {
      _jsMap = deeplayJSMap;
    } else if (lcDev.startsWith('anbernic-keys')) {
      _jsMap = anbernicJSMap;
    } else if (lcDev.startsWith('sony')) {
      _jsMap = sonyPS4JSMap;
    } else {
      _jsMap = xbox360JSMap;
    }
  }
  
  return {
    id: device.name,
    name: device.name,
    index: device._index,
    guid: device.guid,
    mapping: 'standard',
    axes: Array(6).fill(0),
    buttons: Array(17).fill(0).map(() => {
      return {pressed: false, value: 0}
    }),
    _sdltype,
    _jsMap,
    device,
  }
}

function addController(device) {
  let exists = false;
  gamepads.forEach((gp) => {
    if (gp.guid === device.guid) {
      exists = true;
      console.log('controller already exists', device);
    }
  });
  if (!exists) {
    console.log('adding controller', device, joystick.devices.length);
    const gp = createGamepad(device, 'controller');
    console.log('opening controller', device);
    const instance = controller.openDevice(device);
    console.log('controller instance open', instance);
    if (globalThis._jsg.debug) {
      const sdlController = {
        instance,
        state: {
          buttons: {...instance.buttons},
          axes: {...instance.axes},
        },
        device,
      };
      Object.keys(sdlController.instance).forEach((key) => {
        sdlController.state[key] = 0;
      });
      globalThis._jsg.controllers.push(sdlController);
      instance.on('*', (type, e) => {
        // console.log('controller event', type, e);
        if (type === 'buttonDown') {
          sdlController.state.buttons[e.button] = 1;
        } else if (type === 'buttonUp') {
          sdlController.state.buttons[e.button] = 0;
        } else if (type === 'axisMotion') {
          // console.log('AXIS MOTION', sdlController.state.axes);
          sdlController.state.axes[e.axis] = e.value;
        }
      });
    }
    instance.on('*', (type, e) => {
      // console.log('controller event', type, e);
      if (type === 'buttonDown') {
        if (stdGamepadMapping[e.button] !== undefined) {
          const btn = gp.buttons[stdGamepadMapping[e.button]];
          btn.pressed = true;
          btn.value = 1;
        }
      } else if (type === 'buttonUp') {
        if (stdGamepadMapping[e.button] !== undefined) {
          const btn = gp.buttons[stdGamepadMapping[e.button]];
          btn.pressed = false;
          btn.value = 0;
        }
      } else if (type === 'axisMotion') {
        if (stdGamepadMapping[e.axis] !== undefined) {
          gp.axes[stdGamepadMapping[e.axis]] = e.value;
        }
        if (e.axis === 'leftTrigger') {
          gp.buttons[6].value = e.value;
          gp.buttons[6].pressed = e.value > 0.11;
        } else if (e.axis === 'rightTrigger') {
          gp.buttons[7].value = e.value;
          gp.buttons[7].pressed = e.value > 0.11;
        }
      }
      // console.log('gamepad', gp);
    });
    gamepads.push(gp);
  }
  
}

function addJoystick(device) {
  let exists = false;
  gamepads.forEach((gp) => {
    if (gp.guid === device.guid) {
      exists = true;
      console.log('joystick already exists', device);
    }
  });
  if (!exists) {
    console.log('adding joystick', device, joystick.devices.length);
    const gp = createGamepad(device, 'joystick');
    console.log('opening joystick', device);
    const instance = joystick.openDevice(device);
    console.log('joystick instance open', instance, instance.buttons, instance.axes, instance.hats);
    if (globalThis._jsg.debug) {
      const sdlJoystick = {
        instance,
        device,
        state: {
          buttons: [...instance.buttons].map((b) => b ? 1 : 0),
          axes: [...instance.axes],
          hats: [...instance.hats],
        },
      };
      instance.on('*', (type, e) => {
        // console.log('joystick event', type, e);
        if (type === 'buttonDown') {
          sdlJoystick.state.buttons[e.button] = 1;
        } else if (type === 'buttonUp') {
          sdlJoystick.state.buttons[e.button] = 0;
        }
        if (type === 'axisMotion') {
          sdlJoystick.state.axes[e.axis] = e.value;
        }
        if (type === 'hatMotion') {
          sdlJoystick.state.hats[e.hat] = e.value;
        }
      });
      globalThis._jsg.joysticks.push(sdlJoystick);
    }
    instance.on('*', (type, e) => {
      // console.log('JOYSTICK event', type, e);
      if (type === 'buttonDown') {
        if (gp._jsMap.buttons[e.button] !== undefined) {
          // console.log('button down', e.button, gp._jsMap[e.button]);
          const btn = gp.buttons[gp._jsMap.buttons[e.button]];
          if (btn) {
            btn.pressed = true;
            btn.value = 1;
          }
        }
      } else if (type === 'buttonUp') {
        if (gp._jsMap.buttons[e.button] !== undefined) {
          // console.log('button up', e.button, gp._jsMap[e.button]);
          const btn = gp.buttons[gp._jsMap.buttons[e.button]];
          if (btn) {
            btn.pressed = false;
            btn.value = 0;
          }
        }
      } else if (type === 'axisMotion') {
        if (gp._jsMap.axesHandler) {
          gp._jsMap.axesHandler(gp, e);
          return;
        }
        gp.axes[e.axis] = e.value;
        if (e.axis === 4) {
          let val = (e.value + 1) / 2;
          gp.buttons[6].value = val;
          gp.buttons[6].pressed = val > 0.11;
        } else if (e.axis === 5) {
          let val = (e.value + 1) / 2;
          gp.buttons[7].value = val;
          gp.buttons[7].pressed = val > 0.11;
        }
      } else if (type === 'hatMotion' && e.hat === 0) {
        
        if (e.value === 'up') {
          gp.buttons[12].pressed = true;
          gp.buttons[12].value = 1;
        } else if (e.value === 'down') {
          gp.buttons[13].pressed = true;
          gp.buttons[13].value = 1;
        } else if (e.value === 'left') {
          gp.buttons[14].pressed = true;
          gp.buttons[14].value = 1;
        } else if (e.value === 'right') {
          gp.buttons[15].pressed = true;
          gp.buttons[15].value = 1;
        } else if (e.value === 'centered') {
          gp.buttons[12].pressed = false;
          gp.buttons[12].value = 0;
          gp.buttons[13].pressed = false;
          gp.buttons[13].value = 0;
          gp.buttons[14].pressed = false;
          gp.buttons[14].value = 0;
          gp.buttons[15].pressed = false;
          gp.buttons[15].value = 0;
        }
      }
    });
    gamepads.push(gp);
  }
}

export async function initGamepads(addtionalControllerListFile) {

  if (addtionalControllerListFile) {
    try {
      additionalControllerList = await parseCfg(addtionalControllerListFile);
      console.log('additional controllers count', additionalControllerList.length);
    } catch (e) {
      console.error('error parsing additional controller list', e);
    }
  }

  sdl.controller.on('deviceAdd', (e) => {
    console.log('deviceAdd controller', e);
    addController(e.device);
  });
  sdl.joystick.on('deviceAdd', (e) => {
    // just in case controller event is going to fire for same device, we want that instead.
    setTimeout(() => {
      console.log('deviceAdd joystick', e);
      addJoystick(e.device);
    }, 300);
  });
  
  function removeController(device) {
    console.log('deviceRemove controller', device, controller.devices.length);
    const newGamepads = [];
    gamepads.forEach((gp) => {
      if (gp.guid !== device.guid) {
        newGamepads.push(gp);
      }
    });
    gamepads = newGamepads;
  }
  function removeJoystick(device) {
    console.log('deviceRemove joystick', device, joystick.devices.length);
    const newGamepads = [];
    gamepads.forEach((gp) => {
      if (gp.guid !== device.guid) {
        newGamepads.push(gp);
      }
    });
    gamepads = newGamepads;
  }
  sdl.joystick.on('deviceRemove', removeJoystick);
  sdl.controller.on('deviceRemove', removeController);
  
  controller.devices.forEach(addController);
  joystick.devices.forEach(addJoystick);
}
