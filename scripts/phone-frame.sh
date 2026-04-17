#!/usr/bin/env bash
# Wrap an Android screenshot in a clean modern phone frame.
# Usage: scripts/phone-frame.sh input.png output.png
#
# Assumes the input is a standard Android screenshot (9:19.5 aspect or
# close to it). Produces a PNG with a rounded navy frame, a subtle speaker
# slit and a small selfie camera dot, sized to 1200px tall.
set -euo pipefail

IN="$1"
OUT="$2"

if [ ! -f "$IN" ]; then
  echo "Input file not found: $IN" >&2
  exit 1
fi

# Work in a tmp dir so we do not litter
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

# 1. Resize the screenshot to a fixed inner screen size, preserving aspect.
INNER_W=780
INNER_H=1690
convert "$IN" -resize "${INNER_W}x${INNER_H}^" -gravity center -extent "${INNER_W}x${INNER_H}" "$TMP/screen.png"

# 2. Round the screen corners so they sit flush inside the frame.
convert "$TMP/screen.png" \
  \( +clone -alpha extract \
    -draw 'fill black polygon 0,0 0,40 40,0 fill white circle 40,40 40,0' \
    \( +clone -flip \) -compose Multiply -composite \
    \( +clone -flop \) -compose Multiply -composite \
  \) -alpha off -compose CopyOpacity -composite "$TMP/screen-rounded.png"

# 3. Build the frame: rounded-rectangle body with navy bezel.
FRAME_W=860
FRAME_H=1770
BEZEL=40
CORNER=80

convert -size "${FRAME_W}x${FRAME_H}" xc:none \
  \( +clone \
    -draw "fill #0B1A2C roundrectangle 0,0 $((FRAME_W-1)),$((FRAME_H-1)) ${CORNER},${CORNER}" \
  \) -compose DstOver -composite "$TMP/frame.png"

# 4. Composite screen on top of the frame, centered.
convert "$TMP/frame.png" "$TMP/screen-rounded.png" -gravity center -geometry "+0+0" -composite "$TMP/with-screen.png"

# 5. Add a small selfie camera dot at the top.
convert "$TMP/with-screen.png" \
  -fill '#000000' \
  -draw "circle $((FRAME_W/2)),${BEZEL} $((FRAME_W/2)),$((BEZEL-8))" \
  "$TMP/with-camera.png"

# 6. Place the framed phone on a clean light background with a soft drop shadow.
# Build the shadow off the phone silhouette first, then composite phone over it,
# then composite the result onto the light card background.
PAD=80
CANVAS_W=$((FRAME_W + PAD * 2))
CANVAS_H=$((FRAME_H + PAD * 2))

convert "$TMP/with-camera.png" \
  \( +clone -background '#0B1A2C' -alpha Background \
     -channel A -blur 0x18 -evaluate multiply 0.35 +channel \) \
  -compose DstOver -composite \
  "$TMP/phone-with-shadow.png"

convert -size "${CANVAS_W}x${CANVAS_H}" xc:'#F6F8FB' \
  "$TMP/phone-with-shadow.png" -gravity center -compose Over -composite \
  "$OUT"

echo "Framed: $OUT"
