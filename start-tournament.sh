#!/bin/bash

# Tetris AI Tournament System Startup Script
echo "🎮 Starting Tetris AI Tournament System..."
echo "========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🚀 Starting tournament server..."
echo "========================================="

# Start the server
node server.js &
SERVER_PID=$!

echo "✅ Server started with PID: $SERVER_PID"
echo ""

# Wait for server to be ready
sleep 3

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo "🎮 TOURNAMENT SYSTEM READY!"
    echo "========================================="
    echo ""
    echo "📌 Access Points:"
    echo "  • Game: http://localhost:3000/tetris-tournament.html"
    echo "  • Admin: http://localhost:3000/admin-dashboard.html"
    echo "  • Status: http://localhost:3000/tournament-loader.html"
    echo ""
    echo "⌨️  Keyboard Shortcuts:"
    echo "  • Ctrl+T: Open tournament panel"
    echo "  • Ctrl+W: Toggle weight visualizer"
    echo "  • Ctrl+S: Submit to tournament"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo "========================================="
    
    # Open browser (optional - uncomment if desired)
    # if command -v open &> /dev/null; then
    #     open "http://localhost:3000/tournament-loader.html"
    # elif command -v xdg-open &> /dev/null; then
    #     xdg-open "http://localhost:3000/tournament-loader.html"
    # fi
    
    # Keep script running
    wait $SERVER_PID
else
    echo "❌ Server failed to start"
    echo "Check the error messages above"
    exit 1
fi
