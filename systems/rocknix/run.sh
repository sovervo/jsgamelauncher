#!/bin/bash

export LD_LIBRARY_PATH=/usr/lib

source ~/.bash_profile
nvm use 22

cd /storage/jsgamelauncher

node index.js $@
