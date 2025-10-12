#!/usr/bin/env bash
set -euo pipefail

grep -R -n "top-picks" /home/ec2-user/pickntrust/dist/server | head -n 30 || true