#!/usr/bin/env bash
# =============================================================================
# Amazon Nova Reel Video Generation Script (via AWS Bedrock)
# =============================================================================
#
# Generates AI videos from STORYBOARD.md.
# Each frame's "**Video Prompt:**" code block is used as the Nova Reel prompt.
#
# USAGE:
#   bash scripts/generate-videos.sh <project> [frame] [--reference-image <path>]
#   bash scripts/generate-videos.sh ppe 1
#   bash scripts/generate-videos.sh dtr --reference-image public/face_real.jpg
#
# REQUIREMENTS:
#   - AWS credentials with Bedrock access in us-east-1
#   - S3 write access to the output bucket
#
# =============================================================================

set -euo pipefail

REGION="us-east-1"
MODEL_ID="amazon.nova-reel-v1:1"
S3_BUCKET="s3://luma-ray-v2-public/output"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$PROJECT_DIR/public"
STORYBOARD_FILE="$PROJECT_DIR/STORYBOARD.md"
DURATION_SECONDS=6

# --- Parse arguments ---
PROJECT="${1:-}"
FRAME_FILTER=""
REF_IMAGE=""

shift || true
# If next arg is a number, treat as frame filter
if [[ $# -gt 0 && "$1" =~ ^[0-9]+$ ]]; then
  FRAME_FILTER="$1"
  shift
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --reference-image)
      REF_IMAGE="$2"
      shift 2
      ;;
    --duration)
      DURATION_SECONDS="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# --- Project config ---
get_project_config() {
  case "$1" in
    dtr)       HEADING="1. DTR System";              OUTPUT_PREFIX="dtr";       FACE_FRAMES="" ;;
    ppe)       HEADING="2. PPE Detection (Thesis)";  OUTPUT_PREFIX="ppe";       FACE_FRAMES="" ;;
    sheets)    HEADING="3. Sheets-to-Form Automation"; OUTPUT_PREFIX="sheets";  FACE_FRAMES="" ;;
    food)      HEADING="4. Food Price Forecasting";  OUTPUT_PREFIX="food";      FACE_FRAMES="" ;;
    llm)       HEADING="5. Local LLM App";           OUTPUT_PREFIX="llm";       FACE_FRAMES="" ;;
    youtube)   HEADING="6. YouTube Q&A Tool";        OUTPUT_PREFIX="youtube";   FACE_FRAMES="" ;;
    rpsls)     HEADING="7. RPSLS Game";              OUTPUT_PREFIX="rpsls";     FACE_FRAMES="" ;;
    httyd)     HEADING="8. HTTYD Telegram Bots";     OUTPUT_PREFIX="httyd";     FACE_FRAMES="" ;;
    hackathon) HEADING="10. Hackathon Videos";       OUTPUT_PREFIX="hackathon"; FACE_FRAMES="" ;;
    genie)     HEADING="9. Genie Game";              OUTPUT_PREFIX="genie";     FACE_FRAMES="" ;;
    *)
      echo "Unknown project: $1"
      echo "Available: dtr ppe sheets food llm youtube rpsls httyd hackathon genie"
      exit 1
      ;;
  esac
}

if [[ -z "$PROJECT" ]]; then
  echo "Usage: $0 <project> [frame] [--reference-image <path>] [--duration <seconds>]"
  echo "Projects: dtr ppe sheets food llm youtube rpsls httyd hackathon genie"
  echo ""
  echo "Examples:"
  echo "  $0 ppe 1              # Generate PPE frame 1 only"
  echo "  $0 dtr                # Generate all DTR frames with video prompts"
  echo "  $0 ppe 1 --duration 12  # Generate 12-second video"
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

# --- Extract video prompts from STORYBOARD.md ---
# Looks for **Video Prompt:** followed by a ``` code block under each ### Frame N
extract_prompts() {
  local heading="$1"
  local in_project=false
  local in_prompt=false
  local in_code_block=false
  local frame_num=0
  local current_prompt=""

  while IFS= read -r line; do
    # Match project heading: ## N. Project Name (plain string match to handle parens)
    if [[ "$line" == "## $heading" ]]; then
      in_project=true
      continue
    fi

    # Stop at next project heading
    if $in_project && [[ "$line" =~ ^##\ [0-9] ]] && [[ "$line" != "## $heading" ]]; then
      if [[ -n "$current_prompt" ]]; then
        echo "FRAME:$frame_num:$current_prompt"
      fi
      break
    fi

    if ! $in_project; then continue; fi

    # Match frame heading: ### Frame N
    if [[ "$line" =~ ^###\ Frame\ ([0-9]+) ]]; then
      if [[ -n "$current_prompt" ]]; then
        echo "FRAME:$frame_num:$current_prompt"
      fi
      frame_num="${BASH_REMATCH[1]}"
      current_prompt=""
      in_prompt=false
      in_code_block=false
      continue
    fi

    # Match **Video Prompt:** marker
    if [[ "$line" =~ ^\*\*Video\ Prompt:\*\* ]]; then
      in_prompt=true
      continue
    fi

    # Track code block boundaries inside video prompt
    if $in_prompt; then
      if [[ "$line" =~ ^\`\`\` ]]; then
        if $in_code_block; then
          # Closing code block — end of prompt
          in_code_block=false
          in_prompt=false
        else
          # Opening code block
          in_code_block=true
        fi
        continue
      fi

      if $in_code_block && [[ -n "$line" ]]; then
        if [[ -n "$current_prompt" ]]; then
          current_prompt="$current_prompt $line"
        else
          current_prompt="$line"
        fi
      fi
    fi
  done < "$STORYBOARD_FILE"

  # Emit last frame if still inside project
  if $in_project && [[ -n "$current_prompt" ]]; then
    echo "FRAME:$frame_num:$current_prompt"
  fi
}

# --- Build Nova Reel input JSON ---
build_input_json() {
  local prompt="$1"
  local use_face="$2"
  local output_file="$3"

  local escaped_prompt
  escaped_prompt=$(printf '%s' "$prompt" | sed 's/\\/\\\\/g; s/"/\\"/g')

  if [[ "$use_face" == "true" && -n "$REF_IMAGE_B64" ]]; then
    cat > "$output_file" << ENDJSON
{
  "taskType": "TEXT_VIDEO",
  "textToVideoParams": {
    "text": "$escaped_prompt",
    "images": [
      {
        "format": "jpeg",
        "source": {
          "bytes": "$REF_IMAGE_B64"
        }
      }
    ]
  },
  "videoGenerationConfig": {
    "durationSeconds": $DURATION_SECONDS,
    "fps": 24,
    "dimension": "1280x720",
    "seed": 0
  }
}
ENDJSON
  else
    cat > "$output_file" << ENDJSON
{
  "taskType": "TEXT_VIDEO",
  "textToVideoParams": {
    "text": "$escaped_prompt"
  },
  "videoGenerationConfig": {
    "durationSeconds": $DURATION_SECONDS,
    "fps": 24,
    "dimension": "1280x720",
    "seed": 0
  }
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
    local s
    s=$(aws bedrock-runtime get-async-invoke \
      --region "$REGION" \
      --invocation-arn "$arn" \
      --query 'status' --output text 2>&1)

    echo -n "."
    if [[ "$s" == "Completed" ]]; then
      echo " Completed"
      return 0
    elif [[ "$s" == "Failed" ]]; then
      echo " Failed"
      # Print failure reason
      aws bedrock-runtime get-async-invoke \
        --region "$REGION" \
        --invocation-arn "$arn" \
        --query 'failureMessage' --output text 2>&1
      return 0
    fi
    sleep 10
  done
}

# --- Pre-flight: wait for any in-progress invocations ---
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

    echo "  Waiting for in-progress invocation to finish..."
    sleep 15
  done
}

# --- Main execution ---
echo "=== Amazon Nova Reel Video Generation ==="
echo "Project: $PROJECT ($HEADING)"
echo "Region: $REGION"
echo "Model: $MODEL_ID"
echo "S3 Bucket: $S3_BUCKET"
echo "Duration: ${DURATION_SECONDS}s per frame"
if [[ -n "$FRAME_FILTER" ]]; then
  echo "Frame filter: $FRAME_FILTER"
fi
echo ""

echo "Extracting video prompts from $STORYBOARD_FILE..."
FRAMES=()
while IFS= read -r frame_line; do
  frame_num=$(echo "$frame_line" | cut -d: -f2)
  # Apply frame filter if set
  if [[ -n "$FRAME_FILTER" && "$frame_num" != "$FRAME_FILTER" ]]; then
    continue
  fi
  FRAMES+=("$frame_line")
done < <(extract_prompts "$HEADING")

FRAME_COUNT=${#FRAMES[@]}
if [[ $FRAME_COUNT -eq 0 ]]; then
  echo "Error: No frames with **Video Prompt:** found for '$HEADING' in $STORYBOARD_FILE"
  exit 1
fi

echo "Found $FRAME_COUNT frame(s) with video prompts"
echo ""

OUTPUT_FILES=()

for idx in "${!FRAMES[@]}"; do
  line="${FRAMES[$idx]}"
  frame_num=$(echo "$line" | cut -d: -f2)
  prompt=$(echo "$line" | cut -d: -f3-)

  use_face="false"
  if [[ -n "${FACE_FRAMES:-}" ]] && echo "$FACE_FRAMES" | grep -qw "$frame_num"; then
    use_face="true"
  fi

  input_json="/tmp/nova_${PROJECT}_frame${frame_num}.json"
  build_input_json "$prompt" "$use_face" "$input_json"

  s3_prefix="${PROJECT}-frame${frame_num}"
  output_file="$PUBLIC_DIR/${OUTPUT_PREFIX}-frame${frame_num}.mp4"

  echo "[$((idx+1))/$FRAME_COUNT] Frame $frame_num"
  echo "  Prompt: ${prompt:0:100}..."
  echo "  Face ref: $use_face"

  # Ensure no other invocation is running
  wait_for_slot

  max_retries=3
  attempt=0
  success=false

  while [[ $attempt -lt $max_retries ]]; do
    attempt=$((attempt + 1))
    echo "  Submitting (attempt $attempt/$max_retries)..."

    invocation_id=$(submit_segment "$input_json" "$s3_prefix")
    echo "  Invocation: $invocation_id"

    echo -n "  Polling"
    result=$(poll_completion "$invocation_id")

    if [[ "$result" != *"Failed"* ]]; then
      success=true
      break
    fi

    echo "  Failed. Waiting 60s before retry..."
    sleep 60
    wait_for_slot
  done

  if ! $success; then
    echo "  ERROR: Frame $frame_num failed after $max_retries attempts. Skipping."
    continue
  fi

  echo "  Downloading to $output_file"
  aws s3 cp "$S3_BUCKET/$s3_prefix/$invocation_id/output.mp4" "$output_file"
  echo "  Done: $(ls -lh "$output_file" | awk '{print $5}')"

  OUTPUT_FILES+=("$output_file")

  if [[ $((idx+1)) -lt $FRAME_COUNT ]]; then
    echo "  Waiting 30s before next submission..."
    sleep 30
  fi
done

echo ""
echo "=== All videos generated and downloaded ==="
if [[ ${#OUTPUT_FILES[@]} -gt 0 ]]; then
  ls -lh "${OUTPUT_FILES[@]}"
fi
