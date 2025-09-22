#!/bin/bash

# Version 1.0

echo "Stopping Avatar Chat UI..."
pkill -f "node.*server.js" || true
echo "Stopped."
