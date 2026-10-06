/*
 만지는 숫자는 전부 여기 있다.

 화면 오른쪽 조절판의 값은 여기 적힌 것이 처음 값이다. 조절판에서 바꾼 값은 그 브라우저에
 남아 새로 고침해도 그대로다. 이 파일의 처음 값을 고치면 남아 있던 값을 버리고 다시 시작한다.

 누가 언제 춤출 차례인지(대화의 규칙)는 숫자가 아니라 순서라서 turn.js 에 있다.
*/

// ─── 조절판 ──────────────────────────────────────────────────────────────
export const PARAMS = [
  // 이만큼 움직이면 「답했다」고 본다. 작으면 조금만 움직여도 받아 주고, 크면 크게 춰야 한다
  { key: "answerAt", label: "답으로 보는 움직임", min: 0.02, max: 0.6, step: 0.01, value: 0.12 },
  // 답을 이만큼 이어서 해야 한 번으로 센다. 지나가는 사람이 답한 것으로 보지 않게 한다
  { key: "answerHold", label: "답이 이어져야 하는 시간(초)", min: 0.2, max: 3, step: 0.1, value: 0.8 },
  // 외계인이 한 번 추는 시간
  { key: "callSeconds", label: "외계인이 추는 시간(초)", min: 1, max: 8, step: 0.2, value: 2.6 },
  // 답을 기다리는 시간. 이만큼 지나도 답이 없으면 외계인이 다시 말을 건다
  { key: "waitSeconds", label: "기다리는 시간(초)", min: 2, max: 20, step: 0.5, value: 7 },
  // 외계인이 관객의 춤을 얼마나 물려받나. 0 이면 혼자 추고, 1 이면 거의 흉내 낸다
  { key: "echo", label: "따라 하는 정도", min: 0, max: 1, step: 0.05, value: 0.6 },
  // 한 번 답할 때마다 그림이 몇 장 나타나나
  { key: "perAnswer", label: "답 한 번에 그림 수", min: 1, max: 4, step: 1, value: 1 },
  // 그림이 나타날 때 커지는 시간
  { key: "growSeconds", label: "그림이 피어나는 시간(초)", min: 0.2, max: 3, step: 0.1, value: 0.9 },
  // 그림 크기
  { key: "artScale", label: "그림 크기", min: 0.3, max: 2.5, step: 0.05, value: 1.0 },
  // 소리를 쌓을지. 꺼 두면 그림만 쌓인다
  { key: "sound", label: "소리", type: "check", value: true },
  // 관객이 보이지 않게 된 뒤 이만큼 지나면 처음으로 돌아간다
  { key: "resetSeconds", label: "처음으로 돌아가는 시간(초)", min: 3, max: 60, step: 1, value: 12 },
  { key: "mirror", label: "좌우 뒤집기", type: "check", value: true },
  { key: "guide", label: "안내 글", type: "check", value: true },
  // 관객의 춤을 어떻게 읽었는지 화면에 한 줄로 보여 준다
  { key: "reading", label: "읽은 것 보이기", type: "check", value: true },
];

// ─── 감지 ────────────────────────────────────────────────────────────────
export const INPUT_WIDTH = 320;    // 사람을 찾는 그림의 가로. 느린 기계에서는 주소에 ?in=256
export const MAX_PEOPLE = 1;       // 한 번에 한 사람이다
export const MOTION_SMOOTH = 0.25; // 움직임 숫자가 튀지 않게 섞는 정도
export const QUALITY_WINDOW = 3.0; // 춤의 성격을 읽는 창의 길이(초). 길면 느긋하게, 짧으면 민감하게 읽는다
export const GONE_SECONDS = 2.0;   // 사람이 이만큼 안 보이면 없는 것으로 본다

// ─── 대화 (turn.js) ──────────────────────────────────────────────────────
export const MAX_TURNS = 12;       // 이만큼 주고받으면 한 세계가 다 찬 것으로 본다
export const GREET_SECONDS = 2.0;  // 사람이 오면 이만큼 뒤에 외계인이 인사한다

// ─── 안내 글 (app.js) ────────────────────────────────────────────────────
export const GUIDE = {
  idle: "낯선 존재에게 춤으로 말을 걸어 보세요",
  greet: "",
  call: "외계인이 말하고 있습니다",
  wait: "이제 당신 차례입니다",
  reply: "",
  full: "하나의 세계가 만들어졌습니다",
};

// ─── 자료 (art.js) ───────────────────────────────────────────────────────
// 그림과 소리는 web/art/ 에 넣는다. 목록은 python3 make_art.py 가 만든다.
export const ART_LIST = "art/art.json";
