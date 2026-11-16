#!/usr/bin/env bash
# Generates every icon, splash and brand PNG from brand/src into the mobile and web apps.
# Needs ImageMagick 7 (magick) and optipng:  sudo dnf install ImageMagick optipng
set -euo pipefail
cd "$(dirname "$0")/.."

MOBILE="${MOBILE_DIR:-academia-mobile}"   # becomes mobile after the folder rename
WEB="${WEB_DIR:-academia-frontend}"       # becomes web after the folder rename
S=brand/src; O=$MOBILE/assets; B=$O/brand; W=$WEB/app
BLUE="#3454D1"   # UI accent, flattens corners and recolours the mark
INSET=86         # percent kept when cutting off baked-in rounded corners (100 if the file is already square)
mkdir -p "$B" "$W"

square() { magick "$1" -gravity center -crop "${INSET}%x${INSET}%+0+0" +repage -background "$BLUE" -alpha remove -alpha off -resize "$3x$3!" "$2"; }
place() { magick "$1" -trim +repage -resize "$(( $3 * $4 / 100 ))x" -background none -gravity center -extent "$3x$3" "$2"; }

magick $S/mark-source.png -fuzz 20% -fill white -opaque "$BLUE" /tmp/mark-light.png
magick $S/mark-source.png -fill black -colorize 100 /tmp/mark-mono.png

square $S/icon-source.png $O/icon.png 1024
place /tmp/mark-light.png $O/android-icon-foreground.png 1024 48
place /tmp/mark-mono.png  $O/android-icon-monochrome.png 1024 48
magick $S/tile-source.png -resize 48x48 $O/favicon.png

magick $S/mark-source.png -trim +repage -resize 512x -background none -gravity center -extent 512x512 $B/mark-color.png
magick /tmp/mark-light.png -trim +repage -resize 512x -background none -gravity center -extent 512x512 $B/mark-light.png
magick $O/icon.png -resize 512x512 $B/play-store-icon.png
magick $O/icon.png -resize 120x120 $B/oauth-consent-logo.png
magick $S/circle-source.png -resize 500x500 $B/github-avatar.png

magick $S/tile-source.png -resize 512x512 $W/icon.png
square $S/tile-source.png $W/apple-icon.png 180
magick $S/tile-source.png -define icon:auto-resize=48,32,16 $W/favicon.ico

optipng -o5 -quiet $O/*.png $B/*.png $W/icon.png $W/apple-icon.png
echo done