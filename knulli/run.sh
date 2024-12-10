#!/bin/bash

export LD_LIBRARY_PATH=/usr/lib

source ~/.bash_profile

cd /userdata/system/jsgamelauncher

node index.js $@
