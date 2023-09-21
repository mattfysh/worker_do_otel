#!/bin/bash

set -e

npm start &

# process management
handle_signal() {
  signal="$1"
  kill -"$signal" $(jobs -p)
}

trap 'handle_signal SIGINT' SIGINT
trap 'handle_signal SIGTERM' SIGTERM

wait
