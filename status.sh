#!/bin/bash

# Version 1.0

echo "Avatar Chat UI Status:"
if pgrep -f "node.*server.js" > /dev/null; then
    echo "✅ Server is running (PID: $(pgrep -f "node.*server.js"))"
    echo "🌐 Access: http://localhost:3000"
else
    echo "⭕ Server is not running"
fi
