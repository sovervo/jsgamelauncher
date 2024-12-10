# @monteslu/jsgamelauncher

A compatibily layer for Javscript games to run WITHOUT a browser or electron using standard web APIs.

## Browser APIs available
* canvas
* gamepads
* keyboard
* mouse
* localStorage


## Running on a desktop OS

* use at least node 22
* clone this repo
* cd to this directory
* npm install
* `node index /full/path/to/game.js`


## installing on knulli (custom linux for Anbernic retro handhelds)
* make sure wifi is turned on your knulli device
* `ssh root@<myKnullidevice>`  (default password: linux)
* `touch ~/.bash_profile`
* `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash`
* `nvm install 22`
* `exit`
* copy this directory (jsgameslauncher) to `/userdata/system` on the knulli device
* `ssh root@<myKnullidevice>`  (yes, again)
* `chmod +x ~/jsgameslauncher/knulli/run.sh`
* `cp ~/jsgameslauncher/knulli/es_systems_jsgames.cfg ~/configs/emulationstation/`
* `mkdir /userdata/roms/jsgames`
* copy any "roms" to jsgames  (can do this with samba, ftp, or onto the SD card)
* restart the system
* ENJOY!



