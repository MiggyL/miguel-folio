#!/usr/bin/env bash
# =============================================================================
# Titan Image Generator Script (via AWS Bedrock)
# =============================================================================
#
# Generates static images from the storyboards.md file.
# Each segment's "### Image Prompt" is used as the Titan prompt.
#
# USAGE:
#   bash scripts/generate-images.sh <project>
#   bash scripts/generate-images.sh all
#   bash scripts/generate-images.sh dtr
#
# REQUIREMENTS:
#   - AWS credentials with Bedrock access in us-west-2
#   - Titan Image Generator v2 model access enabled
#
# THROTTLING:
#   Titan has a rate limit of ~5 requests per minute. This script enforces
#   a 15-second delay between requests to stay within limits. Do NOT run
#   multiple instances of this script in parallel - it will cause throttle
#   errors. Use "all" to generate every project sequentially in one run.
#
# OUTPUT:
#   Images are saved to public/<prefix>_seg<N>.png at 1173x640 (16:9)
#   to match the portfolio header without resizing.
#
# =============================================================================

set -euo pipefail

REGION="us-west-2"
MODEL_ID="amazon.titan-image-generator-v2:0"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$PROJECT_DIR/public"
STORYBOARD_FILE="$PROJECT_DIR/storyboards.md"

# 16:9 resolution supported by Titan Image Generator
IMG_WIDTH=1173
IMG_HEIGHT=640

# Delay between requests to avoid Bedrock throttling (~5 req/min limit)
THROTTLE_DELAY=15

# --- Parse arguments ---
PROJECT="${1:-}"

if [[ -z "$PROJECT" ]]; then
  echo "Usage: $0 <project|all>"
  echo "Projects: dtr resume ppe sheets food llm youtube rpsls httyd hackathon genie"
  echo "Use 'all' to generate every project sequentially."
  exit 1
fi

# --- Handle 'all' by recursing into each project ---
if [[ "$PROJECT" == "all" ]]; then
  ALL_PROJECTS=(dtr resume ppe sheets food llm youtube rpsls httyd hackathon genie)
  for p in "${ALL_PROJECTS[@]}"; do
    echo ""
    echo "====================================================="
    echo "  Generating: $p"
    echo "====================================================="
    bash "$0" "$p"
  done
  echo ""
  echo "=== All projects complete ==="
  exit 0
fi

# --- Project config ---
get_project_config() {
  case "$1" in
    dtr)       HEADING="01 - DTR System";              OUTPUT_PREFIX="dtr_seg" ;;
    resume)    HEADING="02 - Interactive Resume";       OUTPUT_PREFIX="resume_seg" ;;
    ppe)       HEADING="03 - PPE Detection";            OUTPUT_PREFIX="ppe_seg" ;;
    sheets)    HEADING="04 - Sheets-to-Form";           OUTPUT_PREFIX="sheets_seg" ;;
    food)      HEADING="05 - Food Price Forecasting";   OUTPUT_PREFIX="food_seg" ;;
    llm)       HEADING="06 - Local LLM App";            OUTPUT_PREFIX="llm_seg" ;;
    youtube)   HEADING="07 - YouTube Q&A Tool";         OUTPUT_PREFIX="youtube_seg" ;;
    rpsls)     HEADING="08 - RPSLS Game";               OUTPUT_PREFIX="rpsls_seg" ;;
    httyd)     HEADING="09 - HTTYD Telegram Bots";      OUTPUT_PREFIX="httyd_seg" ;;
    hackathon) HEADING="10 - Hackathon Videos";         OUTPUT_PREFIX="hackathon_seg" ;;
    genie)     HEADING="11 - Genie Game";               OUTPUT_PREFIX="genie_seg" ;;
    *)
      echo "Unknown project: $1"
      echo "Available: dtr resume ppe sheets food llm youtube rpsls httyd hackathon genie"
      exit 1
      ;;
  esac
}

get_project_config "$PROJECT"

if [[ ! -f "$STORYBOARD_FILE" ]]; then
  echo "Error: Storyboard file not found: $STORYBOARD_FILE"
  exit 1
fi

# --- Extract image prompts from storyboard ---
extract_prompts() {
  local heading="$1"
  local in_project=false
  local in_prompt=false
  local segment_num=0
  local current_prompt=""

  while IFS= read -r line; do
    if [[ "$line" =~ ^#\ .*"$heading" ]]; then
      in_project=true
      continue
    fi

    if $in_project && [[ "$line" =~ ^#\ [0-9] ]] && [[ ! "$line" =~ "$heading" ]]; then
      if [[ -n "$current_prompt" ]]; then
        echo "SEGMENT:$segment_num:$current_prompt"
        current_prompt=""
      fi
      break
    fi

    if ! $in_project; then continue; fi

    if [[ "$line" =~ ^##\ Segment\ ([0-9]+) ]]; then
      if [[ -n "$current_prompt" ]]; then
        echo "SEGMENT:$segment_num:$current_prompt"
      fi
      segment_num="${BASH_REMATCH[1]}"
      current_prompt=""
      in_prompt=false
      continue
    fi

    if [[ "$line" =~ ^###\ Image\ Prompt ]]; then
      in_prompt=true
      continue
    fi

    if [[ "$line" =~ ^###\ Avatar\ Script ]]; then
      in_prompt=false
      continue
    fi

    if $in_prompt && [[ -n "$line" ]]; then
      if [[ -n "$current_prompt" ]]; then
        current_prompt="$current_prompt $line"
      else
        current_prompt="$line"
      fi
    fi
  done < "$STORYBOARD_FILE"

  if $in_project && [[ -n "$current_prompt" ]]; then
    echo "SEGMENT:$segment_num:$current_prompt"
  fi
}

# --- Generate image for a segment ---
generate_image() {
  local prompt="$1"
  local output_file="$2"

  local escaped_prompt
  escaped_prompt=$(printf '%s' "$prompt" | sed 's/\\/\\\\/g; s/"/\\"/g')

  local input_file="/tmp/titan_input_$$.json"
  local output_json="/tmp/titan_output_$$.json"

  cat > "$input_file" << ENDJSON
{
  "taskType": "TEXT_IMAGE",
  "textToImageParams": {
    "text": "$escaped_prompt"
  },
  "imageGenerationConfig": {
    "numberOfImages": 1,
    "width": $IMG_WIDTH,
    "height": $IMG_HEIGHT,
    "cfgScale": 8.0
  }
}
ENDJSON

  local max_retries=5
  local attempt=0

  while [[ $attempt -lt $max_retries ]]; do
    attempt=$((attempt + 1))

    if aws bedrock-runtime invoke-model \
      --region "$REGION" \
      --model-id "$MODEL_ID" \
      --content-type "application/json" \
      --accept "application/json" \
      --body "fileb://$input_file" \
      "$output_json" > /dev/null 2>&1; then

      # Extract base64 image from response and decode to file
      python3 -c "
import json, base64
with open('$output_json') as f:
    data = json.load(f)
img_b64 = data['images'][0]
with open('$output_file', 'wb') as f:
    f.write(base64.b64decode(img_b64))
"
      rm -f "$input_file" "$output_json"
      return 0
    fi

    echo "  Throttled (attempt $attempt/$max_retries). Waiting 60s..."
    sleep 60
  done

  rm -f "$input_file" "$output_json"
  echo "  ERROR: Failed after $max_retries attempts"
  return 1
}

# --- Main execution ---
echo "=== Titan Image Generation ==="
echo "Project: $PROJECT ($HEADING)"
echo "Region: $REGION"
echo "Resolution: ${IMG_WIDTH}x${IMG_HEIGHT} (16:9)"
echo ""

echo "Extracting prompts from $STORYBOARD_FILE..."
SEGMENTS=()
while IFS= read -r seg_line; do
  SEGMENTS+=("$seg_line")
done < <(extract_prompts "$HEADING")

SEGMENT_COUNT=${#SEGMENTS[@]}
if [[ $SEGMENT_COUNT -eq 0 ]]; then
  echo "Error: No segments found for project '$HEADING' in $STORYBOARD_FILE"
  exit 1
fi

echo "Found $SEGMENT_COUNT segments"
echo ""

OUTPUT_FILES=()

for idx in "${!SEGMENTS[@]}"; do
  line="${SEGMENTS[$idx]}"
  seg_num=$(echo "$line" | cut -d: -f2)
  prompt=$(echo "$line" | cut -d: -f3-)

  output_file="$PUBLIC_DIR/${OUTPUT_PREFIX}${seg_num}.png"

  echo "[$((idx+1))/$SEGMENT_COUNT] Segment $seg_num"
  echo "  Prompt: ${prompt:0:80}..."
  echo "  Output: $output_file"

  generate_image "$prompt" "$output_file"

  if [[ -f "$output_file" ]]; then
    echo "  Done: $(ls -lh "$output_file" | awk '{print $5}')"
    OUTPUT_FILES+=("$output_file")
  else
    echo "  ERROR: Failed to generate image"
  fi

  # Throttle: Titan allows ~5 req/min. 15s delay keeps us safely under.
  if [[ $((idx+1)) -lt $SEGMENT_COUNT ]]; then
    echo "  Throttle: waiting ${THROTTLE_DELAY}s..."
    sleep "$THROTTLE_DELAY"
  fi
done

echo ""
echo "=== All images generated ==="
ls -lh "${OUTPUT_FILES[@]}"
