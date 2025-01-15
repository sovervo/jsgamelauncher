#!/bin/bash

export LD_LIBRARY_PATH=/usr/lib

source ~/.bash_profile

cd /storage/jsgamelauncher

node index.js $@
