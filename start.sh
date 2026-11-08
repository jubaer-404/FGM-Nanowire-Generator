#!/bin/bash
set -e

echo "=============================================================="
echo "   Multi-Material FGM Nanostructure Generator (LAMMPS MD)    "
echo "=============================================================="
echo ""

if ! command -v npm &> /dev/null; then
    echo "[ERROR] Node.js is not detected on your system."
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[1/2] First time setup: Installing dependencies..."
    npm install
    echo ""
fi

echo "[2/2] Launching FGM Nanostructure Generator..."
echo "Opening browser at http://localhost:3000"

if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 &
elif command -v open &> /dev/null; then
    open http://localhost:3000 &
fi

npm run dev
