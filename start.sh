#!/usr/bin/env bash
#
# 켜기 (맥 · 리눅스)
#
#   ./start.sh                 카메라로 켠다
#   ./start.sh --sim           카메라 없이 가짜 관객으로
#   ./start.sh --display       조절판 없이 화면만 (전시용)
#   ./start.sh --offline 20    장비 없이 20초를 out.mp4 로 적는다
#   ./start.sh --host 0.0.0.0  다른 컴퓨터에서 본다
#   ./start.sh --port 7001     포트를 바꾼다
#
# conda 환경(dancereply)으로 켠다. conda 는 터미널 설정 없이도 찾는다(scripts/conda.sh).
set -euo pipefail
cd "$(dirname "$0")"
# shellcheck source=scripts/conda.sh
source scripts/conda.sh

CONDA="$(find_conda)" || { echo "conda 가 없습니다. 먼저 설치해 주세요:  bash install.sh" >&2; exit 1; }
env_exists "$CONDA" || { echo "conda 환경($ENV_NAME)이 없습니다. 먼저 설치해 주세요:  bash install.sh" >&2; exit 1; }
py() { "$CONDA" run --no-capture-output -n "$ENV_NAME" python "$@"; }

# 모델이 없으면 한 번 받아 본다. 못 받아도 가짜 관객으로는 돈다.
[ -f "web/models/pose_landmarker_lite.task" ] || py fetch_model.py || true

# 작가가 web/art/ 에 넣어 둔 그림과 소리 목록을 다시 만든다. 파일만 넣으면 되게 한다.
py make_art.py

py serve.py "$@"
