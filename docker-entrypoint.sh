#!/bin/sh
set -e

SERVE_STATIC=0 node server/index.mjs &
nginx -g 'daemon off;'
