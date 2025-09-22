#!/bin/bash
echo "Starting Avatar Chat UI v6 Enhanced in development mode..."
cd backend
if [ ! -f server.js ]; then
    echo "❌ Error: server.js not found in backend directory"
    echo "Please ensure all files are properly uploaded"
    exit 1
fi
if command -v nodemon &> /dev/null; then
    npm run dev
else
    echo "⚠️ nodemon not found, using node instead"
    npm start
fi
