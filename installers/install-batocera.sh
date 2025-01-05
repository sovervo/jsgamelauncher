#!/usr/bin/env bash

{ # this ensures the entire script is downloaded #

# Not sure why nvm has all these functions but I don't mind them
my_has() {
  type "$1" > /dev/null 2>&1
}

my_distro_check() {
  if grep -q "knulli" /etc/issue; then
    return 0  # True
  elif grep -q "READY" /etc/issue; then
    return 0  # True
  else 
    return 1  # False
  fi
}

my_echo() {
  command printf %s\\n "$*" 2>/dev/null
}

#
# Unsets the various functions defined
# during the execution of the install script
#
my_reset() {
  unset -f my_has my_echo 
}

# this breaks the script with curl -o- . . . will figure out another way to do this later
# # Ask about installing sample games
# read -r -p "Do you want to copy/update the sample games (in addition to enabling the launcher)? (yes/no): " answer

# # Convert the answer to lowercase for easier comparison
# answer=$(echo "$answer" | tr '[:upper:]' '[:lower:]')

# # Change directory based on the answer
# if [[ "$answer" == "yes" || "$answer" == "y" ]]; then
#   my_echo "=> In the future, I'll copy/update the sample games"
# elif [[ "$answer" == "no" || "$answer" == "n" ]]; then
#   my_echo "=> In the future, I won't copy/update the sample games"
# else
#   my_echo "Invalid input. Please answer 'yes' or 'no' next time!"
#   exit 1
# fi

my_echo "=> STARTING INSTALL"


if [ -z "${BASH_VERSION}" ] || [ -n "${ZSH_VERSION}" ]; then
  my_echo >&2 'Error: the install instructions explicitly say to pipe the install script to `bash`; please follow them'
  exit 1
fi

my_grep() {
  GREP_OPTIONS='' command grep "$@"
}

# check to see if I'm running on a knulli/batocera device
if my_distro_check; then
  my_echo "=> This is a compatible device, /etc/issue says so"
else
  my_echo "=> This NOT is a compatible device, EXITING!!"
  exit 1
fi

# NVM can't update the .bash_profile if one doesn't exist
touch ~/.bash_profile

my_echo "=> Installing NVM"

# Download and execute the nvm installation script . . . move this below if the version of NVM doesn't matter
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# make sure nvm is in the path
if ! grep -q "nvm.sh" ~/.bash_profile; then
  echo "export NVM_DIR=\"$HOME/.nvm\"" >> ~/.bash_profile
  echo "[ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\"" >> ~/.bash_profile
  my_echo "=> Note: I updated your bash_profile to include nvm"
else 
  my_echo "=> Note: You already have nvm in your bash_profile"
fi

my_echo "=> Installing Node.js version 22"

source ~/.bash_profile
nvm install 22

cd ~
my_echo "=> Cleaning up old files"
if [ -d "$HOME/newjsgamelaunchermain.zip" ]; then
  my_echo "=> File ~/jsgamelaunchermain.zip exists. Deleting..."
  rm -rf ~/newjsgamelaunchermain.zip
fi

if [ -d "$HOME/jsgamelauncher-main" ]; then
  my_echo "=> File ~/jsgamelauncher-main exists. Deleting..."
  rm -rf ~/jsgamelauncher-main
fi

my_echo "=> Downloading jsgamelauncher"
curl -o newjsgamelaunchermain.zip -L https://github.com/monteslu/jsgamelauncher/archive/refs/heads/main.zip
unzip newjsgamelaunchermain.zip


if my_distro_check; then
  my_echo "=> This is a knulli device, so I'm moving files around! And running npm install in the jsgamelauncher directory"
  if [ -d "$HOME/jsgamelauncher" ]; then
    my_echo "=> Folder ~/jsgamelauncher exists. Deleting..."
    rm -rf ~/jsgamelauncher
  else 
    my_echo "=> Folder ~/jsgamelauncher does not exist. Copying ..."
  fi
  mkdir ~/jsgamelauncher
  mv jsgamelauncher-main/* ~/jsgamelauncher/

  # Clean up after move
  rm newjsgamelaunchermain.zip
  rm -rf jsgamelauncher-main

  chmod +x ~/jsgamelauncher/knulli/run.sh
  cp ~/jsgamelauncher/knulli/es_systems_jsgames.cfg ~/configs/emulationstation/


  if [ -d "/userdata/roms/jsgames" ]; then
    my_echo "=> Folder /userdata/roms/jsgames exists, no need to create it."
  else 
    mkdir /userdata/roms/jsgames
  fi
  
  cd ~/jsgamelauncher
  npm install
  my_echo "=> INSTALL SUCCESSFUL!"
  cd ~
else
  my_echo "=> my_distro_check says this is NOT is a knulli device, so I'm not moving files around!"
  my_echo "=> INSTALL (sorta)SUCCESSFUL!"
fi

my_reset

} # this ensures the entire script is downloaded