#!/bin/bash

# Version 1.0

echo "Starting Avatar Chat UI v6 Enhanced..."
cd backend
if [ ! -f server.js ]; then
    echo "❌ Error: server.js not found in backend directory"
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    exit 1
fi
npm start
