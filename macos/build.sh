#!/usr/bin/env bash
# Builds WJC3 Radio.app and Discovery Radio.app
# Run from anywhere: bash macos/build.sh
# Output: two .app bundles in ~/Applications
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
OUT_DIR="$HOME/Applications"
mkdir -p "$OUT_DIR"

# ── Build .icns from favicon.svg ─────────────────────
make_icns() {
    local svg="$REPO_DIR/favicon.svg"
    local icns_out="$SCRIPT_DIR/AppIcon.icns"
    local iconset="/tmp/AppIcon.iconset"

    echo "→ Generating AppIcon.icns..."
    rm -rf "$iconset" && mkdir "$iconset"

    # Render SVG → 1024px PNG via Quick Look
    qlmanage -t -s 1024 -o /tmp/ "$svg" > /dev/null 2>&1
    local src="/tmp/favicon.svg.png"

    for size in 16 32 64 128 256 512 1024; do
        sips -z $size $size "$src" --out "$iconset/icon_${size}x${size}.png" > /dev/null
    done

    # @2x variants expected by iconutil
    cp "$iconset/icon_32x32.png"   "$iconset/icon_16x16@2x.png"
    cp "$iconset/icon_64x64.png"   "$iconset/icon_32x32@2x.png"
    cp "$iconset/icon_256x256.png" "$iconset/icon_128x128@2x.png"
    cp "$iconset/icon_512x512.png" "$iconset/icon_256x256@2x.png"
    cp "$iconset/icon_1024x1024.png" "$iconset/icon_512x512@2x.png"

    iconutil -c icns "$iconset" -o "$icns_out"
    rm -rf "$iconset" "$src"
    echo "  ✓ AppIcon.icns"
}

# ── Build one .app ────────────────────────────────────
build_app() {
    local display_name="$1"
    local swift_file="$2"
    local bundle_id="$3"
    local app_path="$OUT_DIR/${display_name}.app"

    echo "→ Building ${display_name}.app..."

    rm -rf "$app_path"
    mkdir -p "$app_path/Contents/MacOS"
    mkdir -p "$app_path/Contents/Resources"

    # Compile
    swiftc -framework Cocoa -framework WebKit \
        "$SCRIPT_DIR/$swift_file" \
        -o "$app_path/Contents/MacOS/$display_name"

    # Copy icon
    cp "$SCRIPT_DIR/AppIcon.icns" "$app_path/Contents/Resources/AppIcon.icns"

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
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
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

make_icns
build_app "WJC3 Radio"      "WJC3Radio.swift"      "com.ravijankar.wjc3radio"
build_app "Discovery Radio" "DiscoveryRadio.swift" "com.ravijankar.discoveryradio"

echo ""
echo "Done. Apps are in $OUT_DIR"
echo "First launch: right-click → Open (to bypass Gatekeeper)"
