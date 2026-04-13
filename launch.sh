#!/bin/bash
PORT=8765
DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill any previous instance on this port
lsof -ti tcp:$PORT | xargs kill -9 2>/dev/null

# Start local server
python3 -m http.server $PORT --directory "$DIR" &
SERVER_PID=$!

# Give it a moment to start
sleep 0.5

# Open in Chrome (install prompt appears in the address bar)
open -a "Google Chrome" "http://localhost:$PORT"

echo "Discovery I running at http://localhost:$PORT (PID $SERVER_PID)"
echo "In Chrome: click the install icon (⊕) in the address bar to install as app"
echo "Press Ctrl+C to stop the server"

wait $SERVER_PID
