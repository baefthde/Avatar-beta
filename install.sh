#!/bin/bash
set -e
echo Install dependencies (Ubuntu/Debian)
sudo apt update && sudo apt install -y nodejs npm python3 ffmpeg
cd backend && npm install
echo Done. Start server: npm start