#!/bin/bash
cd "$(dirname "$0")/.."

# Kill any existing dev server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

npm run dev
