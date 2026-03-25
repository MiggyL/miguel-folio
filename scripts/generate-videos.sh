#!/usr/bin/env bash
# =============================================================================
# Luma Ray v2 Video Generation Script (via AWS Bedrock)
# =============================================================================
#
# Generates AI videos from the merged storyboards.md file.
# Each segment's "### Video Description" is used as the Luma prompt.
#
# USAGE:
#   bash scripts/generate-videos.sh <project> [--reference-image <path>]
#   bash scripts/generate-videos.sh dtr --reference-image public/face_real.jpg
#
# REQUIREMENTS:
#   - AWS credentials with Bedrock access in us-west-2
#   - S3 write access to the output bucket
#   - Luma Ray V2 has a HARD LIMIT of 1 concurrent request per account.
#     This script enforces sequential processing and checks for in-progress
#     invocations before submitting. If another job is running (from a
#     previous script run or the AWS console), this script will wait for
#     it to finish before proceeding.
#
# =============================================================================

set -euo pipefail

REGION="us-west-2"
MODEL_ID="luma.ray-v2:0"
S3_BUCKET="s3://luma-ray-v2-public/output"
DELAY_BETWEEN_SUBMISSIONS=120
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$PROJECT_DIR/public"
STORYBOARD_FILE="$PROJECT_DIR/storyboards.md"

# --- Parse arguments ---
PROJECT="${1:-}"
REF_IMAGE=""

shift || true
while [[ $# -gt 0 ]]; do
  case "$1" in
    --reference-image)
      REF_IMAGE="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# --- Project config (simple if/elif instead of associative arrays) ---
get_project_config() {
  case "$1" in
    dtr)       HEADING="01 - DTR System";              OUTPUT_PREFIX="dtr_seg";       FACE_SEGMENTS="3 6" ;;
    resume)    HEADING="02 - Interactive Resume";       OUTPUT_PREFIX="resume_seg";    FACE_SEGMENTS="" ;;
    ppe)       HEADING="03 - PPE Detection";            OUTPUT_PREFIX="ppe_seg";       FACE_SEGMENTS="" ;;
    sheets)    HEADING="04 - Sheets-to-Form";           OUTPUT_PREFIX="sheets_seg";    FACE_SEGMENTS="" ;;
    food)      HEADING="05 - Food Price Forecasting";   OUTPUT_PREFIX="food_seg";      FACE_SEGMENTS="" ;;
    llm)       HEADING="06 - Local LLM App";            OUTPUT_PREFIX="llm_seg";       FACE_SEGMENTS="" ;;
    youtube)   HEADING="07 - YouTube Q&A Tool";         OUTPUT_PREFIX="youtube_seg";   FACE_SEGMENTS="" ;;
    rpsls)     HEADING="08 - RPSLS Game";               OUTPUT_PREFIX="rpsls_seg";     FACE_SEGMENTS="" ;;
    httyd)     HEADING="09 - HTTYD Telegram Bots";      OUTPUT_PREFIX="httyd_seg";     FACE_SEGMENTS="" ;;
    hackathon) HEADING="10 - Hackathon Videos";         OUTPUT_PREFIX="hackathon_seg"; FACE_SEGMENTS="" ;;
    genie)     HEADING="11 - Genie Game";               OUTPUT_PREFIX="genie_seg";     FACE_SEGMENTS="" ;;
    *)
      echo "Unknown project: $1"
      echo "Available: dtr resume ppe sheets food llm youtube rpsls httyd hackathon genie"
      exit 1
      ;;
  esac
}

if [[ -z "$PROJECT" ]]; then
  echo "Usage: $0 <project> [--reference-image <path>]"
  echo "Projects: dtr resume ppe sheets food llm youtube rpsls httyd hackathon genie"
  exit 1
fi

get_project_config "$PROJECT"

if [[ ! -f "$STORYBOARD_FILE" ]]; then
  echo "Error: Storyboard file not found: $STORYBOARD_FILE"
  exit 1
fi

# --- Encode reference image if provided ---
REF_IMAGE_B64=""
if [[ -n "$REF_IMAGE" ]]; then
  if [[ ! -f "$REF_IMAGE" ]]; then
    echo "Error: Reference image not found: $REF_IMAGE"
    exit 1
  fi
  echo "Encoding reference image: $REF_IMAGE"
  REF_IMAGE_B64=$(base64 -i "$REF_IMAGE")
  echo "  Base64 length: ${#REF_IMAGE_B64}"
fi

# --- Extract video descriptions from merged storyboard ---
extract_prompts() {
  local heading="$1"
  local in_project=false
  local in_description=false
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
      in_description=false
      continue
    fi

    if [[ "$line" =~ ^###\ Video\ Description ]]; then
      in_description=true
      continue
    fi

    if [[ "$line" =~ ^###\ Script ]]; then
      in_description=false
      continue
    fi

    if $in_description && [[ -n "$line" ]]; then
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

# --- Build input JSON for a segment ---
build_input_json() {
  local prompt="$1"
  local use_face="$2"
  local output_file="$3"

  local escaped_prompt
  escaped_prompt=$(printf '%s' "$prompt" | sed 's/\\/\\\\/g; s/"/\\"/g')

  if [[ "$use_face" == "true" && -n "$REF_IMAGE_B64" ]]; then
    cat > "$output_file" << ENDJSON
{
  "prompt": "$escaped_prompt",
  "keyframes": {
    "frame0": {
      "type": "image",
      "source": {
        "type": "base64",
        "media_type": "image/jpeg",
        "data": "$REF_IMAGE_B64"
      }
    }
  },
  "aspect_ratio": "16:9",
  "duration": "9s"
}
ENDJSON
  else
    cat > "$output_file" << ENDJSON
{
  "prompt": "$escaped_prompt",
  "aspect_ratio": "16:9",
  "duration": "9s"
}
ENDJSON
  fi
}

# --- Submit and track ---
submit_segment() {
  local input_json="$1"
  local s3_prefix="$2"

  local result
  result=$(aws bedrock-runtime start-async-invoke \
    --region "$REGION" \
    --model-id "$MODEL_ID" \
    --model-input "file://$input_json" \
    --output-data-config "{\"s3OutputDataConfig\": {\"s3Uri\": \"$S3_BUCKET/$s3_prefix/\"}}" \
    2>&1)

  if echo "$result" | grep -q "invocationArn"; then
    local arn
    arn=$(echo "$result" | grep -o '"arn:aws:bedrock[^"]*"' | tr -d '"')
    local invocation_id
    invocation_id=$(echo "$arn" | awk -F'/' '{print $NF}')
    echo "$invocation_id"
  else
    echo "ERROR: $result" >&2
    return 1
  fi
}

poll_completion() {
  local invocation_id="$1"
  local arn="arn:aws:bedrock:$REGION:626635415930:async-invoke/$invocation_id"

  while true; do
    local status
    status=$(aws bedrock-runtime get-async-invoke \
      --region "$REGION" \
      --invocation-arn "$arn" \
      --query 'status' --output text 2>&1)

    if [[ "$status" == "Completed" ]]; then
      echo "Completed"
      return 0
    elif [[ "$status" == "Failed" ]]; then
      echo "Failed"
      return 0  # return 0 so set -e doesn't exit; caller checks output
    fi
    sleep 10
  done
}

# --- Pre-flight: wait for any in-progress invocations (1 concurrent limit) ---
wait_for_slot() {
  while true; do
    local in_progress
    in_progress=$(aws bedrock-runtime list-async-invokes \
      --region "$REGION" \
      --status-equals InProgress \
      --query 'asyncInvokeSummaries | length(@)' \
      --output text 2>&1)

    if [[ "$in_progress" == "0" || "$in_progress" == "None" ]]; then
      return 0
    fi

    echo "  Waiting for in-progress invocation to finish (1 concurrent limit)..."
    sleep 15
  done
}

# --- Main execution ---
echo "=== Luma Ray v2 Video Generation ==="
echo "Project: $PROJECT ($HEADING)"
echo "Region: $REGION"
echo "S3 Bucket: $S3_BUCKET"
echo "Duration: 9s per segment"
echo "Concurrent limit: 1 (enforced by AWS)"
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

INVOCATION_IDS=()
S3_PREFIXES=()
OUTPUT_FILES=()

for idx in "${!SEGMENTS[@]}"; do
  line="${SEGMENTS[$idx]}"
  seg_num=$(echo "$line" | cut -d: -f2)
  prompt=$(echo "$line" | cut -d: -f3-)

  use_face="false"
  if [[ -n "$FACE_SEGMENTS" ]] && echo "$FACE_SEGMENTS" | grep -qw "$seg_num"; then
    use_face="true"
  fi

  input_json="/tmp/luma_${PROJECT}_seg${seg_num}.json"
  build_input_json "$prompt" "$use_face" "$input_json"

  s3_prefix="${PROJECT}-seg${seg_num}"
  output_file="$PUBLIC_DIR/${OUTPUT_PREFIX}${seg_num}.mp4"

  echo "[$((idx+1))/$SEGMENT_COUNT] Segment $seg_num"
  echo "  Prompt: ${prompt:0:80}..."
  echo "  Face ref: $use_face"

  # Ensure no other invocation is running (1 concurrent limit)
  wait_for_slot

  max_retries=3
  attempt=0
  success=false

  while [[ $attempt -lt $max_retries ]]; do
    attempt=$((attempt + 1))
    echo "  Submitting (attempt $attempt/$max_retries)..."

    invocation_id=$(submit_segment "$input_json" "$s3_prefix")
    echo "  Invocation: $invocation_id"

    echo "  Polling for completion..."
    result=$(poll_completion "$invocation_id")

    if [[ "$result" == "Completed" ]]; then
      success=true
      break
    fi

    echo "  Failed. Waiting 60s before retry..."
    sleep 60
    wait_for_slot
  done

  if ! $success; then
    echo "  ERROR: Segment $seg_num failed after $max_retries attempts. Skipping."
    continue
  fi

  echo "  Downloading to $output_file"
  aws s3 cp "$S3_BUCKET/$s3_prefix/$invocation_id/output.mp4" "$output_file"
  echo "  Done: $(ls -lh "$output_file" | awk '{print $5}')"

  OUTPUT_FILES+=("$output_file")

  if [[ $((idx+1)) -lt $SEGMENT_COUNT ]]; then
    echo "  Waiting 30s before next submission..."
    sleep 30
  fi
done

echo ""
echo "=== All videos generated and downloaded ==="
ls -lh "${OUTPUT_FILES[@]}"
