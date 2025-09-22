#!/bin/bash
echo "Stopping Avatar Chat UI..."
pkill -f "node.*server.js" || true
echo "Stopped."
