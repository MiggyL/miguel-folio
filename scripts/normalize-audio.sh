#!/bin/bash
# Normalize audio levels across all EN/DE section videos (two-pass EBU R128)
# and lower ambient.mp3 so it doesn't overpower the talking avatar.
#
# Always reads from public/raw/ (originals) and writes to public/ (output).
# Safe to run repeatedly — never re-encodes from previous output.
#
# Usage: bash scripts/normalize-audio.sh
# Requires: ffmpeg with loudnorm filter

set -euo pipefail

PUBLIC="$(cd "$(dirname "$0")/../public" && pwd)"
RAW="$PUBLIC/raw"

# Target loudness for speech videos (EBU R128 standard)
TARGET_I=-14
TARGET_LRA=11
TARGET_TP=-1.5

# Ambient music target: much quieter so it sits under speech
AMBIENT_I=-24

echo "=== Audio Normalization ==="
echo "Source: $RAW"
echo "Output: $PUBLIC"
echo ""

# Verify raw/ exists
if [ ! -d "$RAW" ]; then
  echo "ERROR: $RAW not found. Place original files there first."
  exit 1
fi

# Extract a loudnorm JSON value by key from ffmpeg output
parse_stat() {
  echo "$1" | grep "\"$2\"" | sed 's/.*: *"//;s/".*//'
}

# --- Two-pass loudnorm for videos ---
normalize_video() {
  local input="$1"
  local output="$2"
  local label="$3"
  local target_i="${4:-$TARGET_I}"

  # Skip videos without audio
  has_audio=$(ffprobe -v quiet -select_streams a -show_entries stream=codec_type -of csv=p=0 "$input")
  if [ -z "$has_audio" ]; then
    echo "  [$label] no audio stream, copying as-is"
    cp "$input" "$output"
    return
  fi

  echo "  [$label] pass 1: measuring loudness..."
  stats=$(ffmpeg -hide_banner -nostdin -i "$input" \
    -af "loudnorm=I=$target_i:LRA=$TARGET_LRA:TP=$TARGET_TP:print_format=json" \
    -f null - 2>&1 | grep -A20 '"input_i"')

  measured_I=$(parse_stat "$stats" "input_i")
  measured_LRA=$(parse_stat "$stats" "input_lra")
  measured_TP=$(parse_stat "$stats" "input_tp")
  measured_thresh=$(parse_stat "$stats" "input_thresh")
  offset=$(parse_stat "$stats" "target_offset")

  if [ -z "$measured_I" ]; then
    echo "  [$label] WARNING: could not parse loudness stats, using single-pass"
    ffmpeg -hide_banner -nostdin -y -i "$input" \
      -af "loudnorm=I=$target_i:LRA=$TARGET_LRA:TP=$TARGET_TP" \
      -c:v copy -c:a aac -b:a 192k -movflags +faststart \
      "$output"
  else
    echo "  [$label] pass 2: normalizing (measured_I=$measured_I → target $target_i)..."
    ffmpeg -hide_banner -nostdin -y -i "$input" \
      -af "loudnorm=I=$target_i:LRA=$TARGET_LRA:TP=$TARGET_TP:measured_I=$measured_I:measured_LRA=$measured_LRA:measured_TP=$measured_TP:measured_thresh=$measured_thresh:offset=$offset:linear=true" \
      -c:v copy -c:a aac -b:a 192k -movflags +faststart \
      "$output"
  fi

  echo "  [$label] done"
}

echo "Normalizing section videos to I=$TARGET_I ..."
for lang in EN DE; do
  [ -d "$RAW/$lang" ] || continue
  mkdir -p "$PUBLIC/$lang"
  for f in "$RAW/$lang"/*.mp4; do
    [ -f "$f" ] || continue
    name="$(basename "$f")"
    normalize_video "$f" "$PUBLIC/$lang/$name" "$lang/$name" "$TARGET_I"
  done
done
echo ""

# --- Ambient music: normalize quieter ---
if [ -f "$RAW/ambient.mp3" ]; then
  echo "Normalizing ambient.mp3 to I=$AMBIENT_I (sits under speech)..."

  stats=$(ffmpeg -hide_banner -nostdin -i "$RAW/ambient.mp3" \
    -af "loudnorm=I=$AMBIENT_I:LRA=$TARGET_LRA:TP=$TARGET_TP:print_format=json" \
    -f null - 2>&1 | grep -A20 '"input_i"')

  measured_I=$(parse_stat "$stats" "input_i")
  measured_LRA=$(parse_stat "$stats" "input_lra")
  measured_TP=$(parse_stat "$stats" "input_tp")
  measured_thresh=$(parse_stat "$stats" "input_thresh")
  offset=$(parse_stat "$stats" "target_offset")

  if [ -z "$measured_I" ]; then
    ffmpeg -hide_banner -nostdin -y -i "$RAW/ambient.mp3" \
      -af "loudnorm=I=$AMBIENT_I:LRA=$TARGET_LRA:TP=$TARGET_TP" \
      -c:a libmp3lame -b:a 192k \
      "$PUBLIC/ambient.mp3"
  else
    echo "  pass 2: normalizing (measured_I=$measured_I → target $AMBIENT_I)..."
    ffmpeg -hide_banner -nostdin -y -i "$RAW/ambient.mp3" \
      -af "loudnorm=I=$AMBIENT_I:LRA=$TARGET_LRA:TP=$TARGET_TP:measured_I=$measured_I:measured_LRA=$measured_LRA:measured_TP=$measured_TP:measured_thresh=$measured_thresh:offset=$offset:linear=true" \
      -c:a libmp3lame -b:a 192k \
      "$PUBLIC/ambient.mp3"
  fi

  echo "  ambient.mp3 done"
fi

echo ""
echo "=== Complete ==="
echo "Speech videos: I=$TARGET_I LUFS"
echo "Ambient music: I=$AMBIENT_I LUFS (10dB quieter than speech)"
