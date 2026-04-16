#!/usr/bin/env bash
# Builds WJC3 Radio.app and Discovery Radio.app
# Run from the macos/ directory: bash build.sh
# Output: two .app bundles in ~/Applications (created if needed)
set -e

OUT_DIR="$HOME/Applications"
mkdir -p "$OUT_DIR"

build_app() {
    local display_name="$1"   # e.g. "WJC3 Radio"
    local swift_file="$2"     # e.g. "WJC3Radio.swift"
    local bundle_id="$3"      # e.g. "com.ravijankar.wjc3radio"
    local width="$4"
    local height="$5"
    local app_path="$OUT_DIR/${display_name}.app"

    echo "→ Building ${display_name}.app..."

    rm -rf "$app_path"
    mkdir -p "$app_path/Contents/MacOS"
    mkdir -p "$app_path/Contents/Resources"

    # Compile
    swiftc -framework Cocoa -framework WebKit \
        "$(dirname "$0")/$swift_file" \
        -o "$app_path/Contents/MacOS/$display_name"

    # Info.plist
    cat > "$app_path/Contents/Info.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${display_name}</string>
    <key>CFBundleIdentifier</key>
    <string>${bundle_id}</string>
    <key>CFBundleName</key>
    <string>${display_name}</string>
    <key>CFBundleDisplayName</key>
    <string>${display_name}</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
</dict>
</plist>
PLIST

    echo "  ✓ $app_path"
}

cd "$(dirname "$0")"

build_app "WJC3 Radio"      "WJC3Radio.swift"      "com.ravijankar.wjc3radio"      700  920
build_app "Discovery Radio" "DiscoveryRadio.swift" "com.ravijankar.discoveryradio" 1400 900

echo ""
echo "Done. Apps are in $OUT_DIR"
echo "First launch: right-click the app → Open (to bypass Gatekeeper)"
