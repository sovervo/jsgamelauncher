# @monteslu/jsgamelauncher

<img src="rg40xxv_demo.jpg" height="300" align="right">

A compatibly layer for JavaScript games to run WITHOUT a browser or electron using standard web APIs.

The goal is to run games on cheap ($50) retro devices that will also run in browsers without any changes. Anything that runs Knulli and has wifi (so Ambernic XX devices as well as TrimUI Smart Pro) should work but that's just the beginning!

## Browser APIs progress

- [x] Canvas (2d)
- [x] WebAudio
- [x] Keyboard events
- [x] Gamepad API
- [x] localStorage
- [ ] WebGL (Canvas 3D)

## JS Game Engine support

- [Phaser](https://phaser.io/)

3D effects are not supported, but you can use the canvas API to draw 3D graphics.

Others might work we just haven't tried them! Let us know if you try them!

## Sample games

[Sample games / Demos / Starter projects](https://github.com/monteslu/jsgames)

## Running on a desktop OS

- use at least node 22
- clone this repo
- cd to this directory
- npm install
- `node index -rom /full/path/to/game.js` (clone sample game at https://github.com/monteslu/jsgames/tuxgame/game.js)

## Installing on Knulli (custom linux for Anbernic retro handhelds)

### Option A) Use the install script!

- Make sure wifi is turned on for your knulli device
- `ssh root@<myKnullidevice>` (default password: linux, default device name : KNULLI, use IP from device or <myKnullidevice>.local if name fails)
- `curl -o- https://raw.githubusercontent.com/monteslu/jsgamelauncher/main/install-knulli.sh | bash`
- That's it! Now you need a game!

You can also get a specific version of jsgamelauncher by changing the version number in the install-knulli.sh script.

- `curl -o- https://raw.githubusercontent.com/monteslu/jsgamelauncher/v0.1.0/install-knulli.sh | bash`

### Option B) The long way (leaving this here for reference for other systems)

- Make sure wifi is turned on for your knulli device
- `ssh root@<myKnullidevice>` (default password: linux, default device name : KNULLI, use IP from device if name fails)
- `touch ~/.bash_profile`
- `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash`
- `source ./.bash_profile`
- `nvm install 22`
- If you did npm install in jsgameslauncher on your local machine, delete the node_modules directory
- Copy this directory (jsgameslauncher) to `/userdata/system` on the knulli device (using the SMB share at \\<myKnullidevice>\share\system, or SFTP, etc)
- `chmod +x ~/jsgameslauncher/knulli/run.sh`
- `cp ~/jsgameslauncher/knulli/es_systems_jsgames.cfg ~/configs/emulationstation/`
- `mkdir /userdata/roms/jsgames`
- `cd ~/jsgameslauncher`
- `npm install`
- Copy any "roms" to jsgames (can do this with samba, ftp, or onto the SD card, note that if you connected via Samba, you might have to force a refresh of the Samba share)
- Restart the system
- ENJOY!

## Running on Batocera

Install script coming soon! Should be very similar to the Knulli install script.

## Running on muOS

Should run here too but we just haven't tested it yet.
