#!/bin/sh
set -e

mkdir -p /run/nginx /var/log/nginx

SERVE_STATIC=0 node server/index.mjs &
exec nginx -g 'daemon off;'
