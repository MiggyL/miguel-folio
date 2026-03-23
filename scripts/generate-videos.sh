#!/bin/bash
# =============================================================================
# Luma Ray v2 Video Generation Script (via AWS Bedrock)
# =============================================================================
#
# PURPOSE:
#   Generates AI videos for portfolio storyboard segments using Luma Ray v2
#   on AWS Bedrock. Each project has multiple segments defined in storyboard
#   markdown files under storyboards/.
#
# PREREQUISITES:
#   - AWS CLI configured with credentials (IAM user: jeremias.lacanienta@cambridge.org)
#   - AWS account: 626635415930
#   - Region: us-west-2 (Luma Ray v2 is ONLY available in us-west-2)
#   - Model ID: luma.ray-v2:0
#   - S3 output bucket: s3://luma-ray-v2-public/output/ (MUST be in us-west-2)
#     NOTE: Do NOT use eu-west-2 buckets - will get "Invalid S3 credentials" error
#
# THROTTLING:
#   - AWS Bedrock throttles Luma requests aggressively
#   - Cannot submit all segments in parallel — will get ThrottlingException
#   - Use DELAY_BETWEEN_SUBMISSIONS (default 120s) between each submission
#   - First request usually succeeds, subsequent ones need delay
#
# IMAGE REFERENCES (keyframes):
#   - Luma Ray v2 accepts character reference images via keyframes.frame0
#   - Format: base64-encoded JPEG/PNG in the model input JSON
#   - Use frame0 for starting image reference (e.g., Miguel's face)
#   - Use frame1 for ending image reference (optional)
#   - Images are embedded directly in the JSON (no S3 URL support for input)
#   - Reference image: public/face_real.jpg (1080x1080 JPEG, ~59KB)
#
# MODEL INPUT FORMAT:
#   {
#     "prompt": "description of the scene",
#     "keyframes": {                          // optional - for character reference
#       "frame0": {
#         "type": "image",
#         "source": {
#           "type": "base64",
#           "media_type": "image/jpeg",
#           "data": "<base64-encoded-image>"
#         }
#       }
#     },
#     "aspect_ratio": "16:9",                // options: 1:1, 16:9, 9:16, 4:3, 3:4, 21:9, 9:21
#     "duration": "5s"                        // options: 5s, 9s
#   }
#
# OUTPUT:
#   - Async invocation returns an invocationArn with an ID
#   - Videos are written to S3: s3://luma-ray-v2-public/output/<prefix>/<invocation-id>/output.mp4
#   - Typical size: 1-3 MB per 5s segment
#   - Generation time: ~2-3 minutes per segment
#
# STORYBOARD FILES:
#   Located in storyboards/ directory. Naming convention:
#     {order}-{project-slug}-{segment}.md
#   Example: 01-dtr-system-1.md, 01-dtr-system-2.md
#   Each file has two sections:
#     ## Video Description  — feed this to the prompt
#     ## Script             — narration text (not used for video generation)
#
# VIDEO FILE NAMING (in public/):
#   - DTR System:         dtr_seg1.mp4 through dtr_seg5.mp4
#   - Interactive Resume:  seg1_intro.mp4 through seg5_contact.mp4
#   - Map to PROJECT_SEGMENTS in app/page.js
#
# USAGE:
#   ./scripts/generate-videos.sh <project> [--reference-image <path>]
#
#   Examples:
#     ./scripts/generate-videos.sh dtr
#     ./scripts/generate-videos.sh dtr --reference-image public/face_real.jpg
#     ./scripts/generate-videos.sh resume
#
# =============================================================================

set -euo pipefail

REGION="us-west-2"
MODEL_ID="luma.ray-v2:0"
S3_BUCKET="s3://luma-ray-v2-public/output"
DELAY_BETWEEN_SUBMISSIONS=120  # seconds — reduce at your own risk (throttling)
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PUBLIC_DIR="$PROJECT_DIR/public"

# --- Project configurations ---
# Add new projects here. Keys match storyboard file prefixes.
# output_prefix: filename prefix for public/ mp4 files
# storyboard_prefix: prefix in storyboards/ directory
# segments_with_face: which segment numbers (1-indexed) should include the reference image
declare -A PROJECT_CONFIG

# DTR System
# Segments 3 (Miguel joins) and 5 (Miguel with AI) use face reference
DTR_OUTPUT_PREFIX="dtr_seg"
DTR_STORYBOARD_PREFIX="01-dtr-system"
DTR_SEGMENT_COUNT=5
DTR_FACE_SEGMENTS="3 5"

# Interactive Resume
RESUME_OUTPUT_PREFIX="seg"
RESUME_STORYBOARD_PREFIX="02-interactive-resume"  # adjust if different
RESUME_SEGMENT_COUNT=5
RESUME_FACE_SEGMENTS=""
RESUME_SUFFIXES=("1_intro" "2_skills" "3_experience" "4_certs" "5_contact")

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

if [[ -z "$PROJECT" ]]; then
  echo "Usage: $0 <project> [--reference-image <path>]"
  echo "Projects: dtr, resume"
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

# --- Build input JSON for a segment ---
build_input_json() {
  local prompt="$1"
  local use_face="$2"
  local output_file="$3"

  if [[ "$use_face" == "true" && -n "$REF_IMAGE_B64" ]]; then
    cat > "$output_file" << ENDJSON
{
  "prompt": "$prompt",
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
  "duration": "5s"
}
ENDJSON
  else
    cat > "$output_file" << ENDJSON
{
  "prompt": "$prompt",
  "aspect_ratio": "16:9",
  "duration": "5s"
}
ENDJSON
  fi
}

# --- Extract video description from storyboard markdown ---
extract_prompt() {
  local md_file="$1"
  # Extract text between "## Video Description" and "## Script"
  sed -n '/^## Video Description/,/^## Script/{/^## /d;p;}' "$md_file" | tr '\n' ' ' | sed 's/  */ /g' | sed 's/^ *//;s/ *$//'
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
      return 1
    fi
    sleep 10
  done
}

# --- Main execution ---
echo "=== Luma Ray v2 Video Generation ==="
echo "Project: $PROJECT"
echo "Region: $REGION"
echo "S3 Bucket: $S3_BUCKET"
echo ""

declare -a INVOCATION_IDS
declare -a S3_PREFIXES
declare -a OUTPUT_FILES

case "$PROJECT" in
  dtr)
    SEGMENT_COUNT=$DTR_SEGMENT_COUNT
    for i in $(seq 1 $SEGMENT_COUNT); do
      md_file="$PROJECT_DIR/storyboards/${DTR_STORYBOARD_PREFIX}-${i}.md"
      if [[ ! -f "$md_file" ]]; then
        echo "Error: Storyboard not found: $md_file"
        exit 1
      fi

      prompt=$(extract_prompt "$md_file")
      use_face="false"
      if echo "$DTR_FACE_SEGMENTS" | grep -qw "$i"; then
        use_face="true"
      fi

      input_json="/tmp/luma_dtr_seg${i}.json"
      build_input_json "$prompt" "$use_face" "$input_json"

      s3_prefix="dtr-seg${i}"
      output_file="$PUBLIC_DIR/${DTR_OUTPUT_PREFIX}${i}.mp4"

      echo "[$i/$SEGMENT_COUNT] Submitting segment $i..."
      invocation_id=$(submit_segment "$input_json" "$s3_prefix")
      echo "  Invocation: $invocation_id"

      INVOCATION_IDS+=("$invocation_id")
      S3_PREFIXES+=("$s3_prefix")
      OUTPUT_FILES+=("$output_file")

      if [[ $i -lt $SEGMENT_COUNT ]]; then
        echo "  Waiting ${DELAY_BETWEEN_SUBMISSIONS}s before next submission (throttle avoidance)..."
        sleep "$DELAY_BETWEEN_SUBMISSIONS"
      fi
    done
    ;;

  resume)
    SEGMENT_COUNT=$RESUME_SEGMENT_COUNT
    for i in $(seq 1 $SEGMENT_COUNT); do
      md_file="$PROJECT_DIR/storyboards/${RESUME_STORYBOARD_PREFIX}-${i}.md"
      if [[ ! -f "$md_file" ]]; then
        echo "Error: Storyboard not found: $md_file"
        exit 1
      fi

      prompt=$(extract_prompt "$md_file")
      input_json="/tmp/luma_resume_seg${i}.json"
      build_input_json "$prompt" "false" "$input_json"

      s3_prefix="resume-seg${i}"
      suffix="${RESUME_SUFFIXES[$((i-1))]}"
      output_file="$PUBLIC_DIR/${RESUME_OUTPUT_PREFIX}${suffix}.mp4"

      echo "[$i/$SEGMENT_COUNT] Submitting segment $i..."
      invocation_id=$(submit_segment "$input_json" "$s3_prefix")
      echo "  Invocation: $invocation_id"

      INVOCATION_IDS+=("$invocation_id")
      S3_PREFIXES+=("$s3_prefix")
      OUTPUT_FILES+=("$output_file")

      if [[ $i -lt $SEGMENT_COUNT ]]; then
        echo "  Waiting ${DELAY_BETWEEN_SUBMISSIONS}s before next submission (throttle avoidance)..."
        sleep "$DELAY_BETWEEN_SUBMISSIONS"
      fi
    done
    ;;

  *)
    echo "Unknown project: $PROJECT"
    echo "Available: dtr, resume"
    exit 1
    ;;
esac

echo ""
echo "=== All segments submitted. Polling for completion... ==="
echo ""

for idx in "${!INVOCATION_IDS[@]}"; do
  inv_id="${INVOCATION_IDS[$idx]}"
  s3_prefix="${S3_PREFIXES[$idx]}"
  output_file="${OUTPUT_FILES[$idx]}"

  echo "Waiting for $inv_id..."
  poll_completion "$inv_id"

  echo "  Downloading to $output_file"
  aws s3 cp "$S3_BUCKET/$s3_prefix/$inv_id/output.mp4" "$output_file"
  echo "  Done: $(ls -lh "$output_file" | awk '{print $5}')"
done

echo ""
echo "=== All videos generated and downloaded ==="
ls -lh "${OUTPUT_FILES[@]}"
