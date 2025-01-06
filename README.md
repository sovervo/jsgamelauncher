# JavaScript Game Launcher

<img src="rg40xxv_demo.jpg" height="300" align="right">

A compatibly layer for JavaScript games to run WITHOUT a browser or electron using standard web APIs.

The goal is to run games on cheap ($50) retro devices that will also run in browsers without any changes. Anything that runs Knulli and has wifi (so Ambernic XX devices as well as TrimUI Smart Pro) should work but that's just the beginning!

### Browser APIs progress

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
- `node index -rom /full/path/to/game.js` (clone sample game at https://github.com/monteslu/jsgames/tree/main/tuxgame or find other games at https://github.com/monteslu/jsgames)

You can also just run the game directly without using jsgamelauncher. The goal is to make web games that also work on a low end device but the web is a first class citizen. Check out the [Simple Vite](https://github.com/monteslu/jsgames/tree/main/simple-vite) example.

## Installing on [Knulli](https://knulli.org/) or [Batocera](https://batocera.org/)

### Option A) Use the install script!

- Make sure wifi is turned on for your knulli device
- `ssh root@<myKnullidevice>` (default password: linux, default device name : KNULLI, use IP from device or <myKnullidevice>.local if name fails)
- `curl -o- https://raw.githubusercontent.com/monteslu/jsgamelauncher/main/installers/install-batocera-knulli.sh | bash`
- That's it! Now you need a [game](https://github.com/monteslu/jsgames)! Just put that in `/userdata/roms/jsgames` if you are on Knulli. All you need is a game.js file as a starting point and a file called "&lt;game name&gt;.jsg". This could change!

For now we only support downloading the latest. At some point we'll modify the download script to accommodate downloading specific published versions.

### Option B) The long way (leaving this here for reference for other systems)

- Make sure wifi is turned on for your Knulli device
- `ssh root@<myKnullidevice>` (default password: linux, default device name : KNULLI, use IP from device if name fails)
- `touch ~/.bash_profile`
- `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash`
- `source ./.bash_profile`
- `nvm install 22`
- If you did npm install in jsgamelauncher on your local machine, delete the node_modules directory
- Copy this directory (jsgamelauncher) to `/userdata/system` on the knulli device (using the SMB share at \\<myKnullidevice>\share\system, or SFTP, etc)
- `chmod +x ~/jsgamelauncher/knulli/run.sh`
- `cp ~/jsgamelauncher/knulli/es_systems_jsgames.cfg ~/configs/emulationstation/`
- `mkdir /userdata/roms/jsgames`
- `cd ~/jsgamelauncher`
- `npm install`
- Copy any "roms" to jsgames (can do this with samba, ftp, or onto the SD card, note that if you connected via Samba, you might have to force a refresh of the Samba share)
- Restart the system
- ENJOY!

## Installing on [muOS](https://muos.dev/)

Coming soon! According to [joyrider3774](https://www.reddit.com/user/joyrider3774/) on this [thread](https://www.reddit.com/r/ANBERNIC/comments/1hsyv9n/comment/m5e2zsy/?context=3) all we need to do is install the GNU versions of ls and tar so that the curl command for installing nvm works.
