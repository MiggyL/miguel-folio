#!/bin/bash
cd "$(dirname "$0")/.."

URL="http://localhost:3000/portfolio"

# Kill any existing dev server on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Open the app in the default browser once the server is responding.
# Runs in the background so it doesn't block npm run dev, and waits up to
# ~30s for the port to come up before opening.
(
  for _ in {1..60}; do
    if curl -s -o /dev/null -w '%{http_code}' "$URL" | grep -qE '^(200|3..)$'; then
      break
    fi
    sleep 0.5
  done
  case "$(uname -s)" in
    Darwin) open "$URL" ;;
    Linux)  xdg-open "$URL" >/dev/null 2>&1 ;;
    *)      echo "Open $URL in your browser." ;;
  esac
) &

npm run dev
