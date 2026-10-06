/*
 시작하는 자리. 감지 → 움직임 → 대화 → 화면·소리 를 한 프레임마다 잇는다.

 주소 뒤에 붙여 쓰는 것
   ?sim          카메라 없이 가짜 관객으로 시작
   ?display      조절판 없이 화면만 (전시용)
   ?video=...    카메라 대신 영상 파일로
   ?in=256       사람을 찾는 그림 크기(기본 320). 느린 기계에서 줄인다
   ?gpu          GPU 로 감지한다 (기본은 CPU)
   ?offline=20   20초를 녹화해 서버에 보내고 끝낸다 (./start.sh --offline 20 이 쓴다)

 그림은 p5.js 가, 소리는 브라우저가 낸다. 카메라 영상은 이 브라우저 안에서만 돌고
 어디로도 보내지 않는다.
*/

import { PARAMS, GUIDE } from "./settings.js";
import { CameraSense, SimSense } from "./sense.js";
import { Motion } from "./motion.js";
import { Turn } from "./turn.js";
import { Art } from "./art.js";
import { Alien } from "./alien.js";
import { Scene } from "./scene.js";
import { Sound } from "./sound.js";

const $ = (id) => document.getElementById(id);
const url = new URLSearchParams(location.search);

const STORE = "dancereply.params.v1";
const DEFAULTS = Object.fromEntries(PARAMS.map((d) => [d.key, d.value]));
const p = { ...DEFAULTS };
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || "null");
  if (saved && JSON.stringify(saved.defaults) === JSON.stringify(DEFAULTS)) Object.assign(p, saved.values);
} catch {}
const save = () => {
  try { localStorage.setItem(STORE, JSON.stringify({ defaults: DEFAULTS, values: p })); } catch {}
};

/* ---------- 조절판 ---------- */

function buildPanel() {
  const box = $("params");
  box.innerHTML = "";
  for (const d of PARAMS) {
    const row = document.createElement("label");
    row.className = "param";
    const input = document.createElement("input");
    if (d.type === "check") {
      input.type = "checkbox";
      input.checked = !!p[d.key];
    } else {
      input.type = "range";
      Object.assign(input, { min: d.min, max: d.max, step: d.step });
      input.value = p[d.key];
    }
    const out = document.createElement("output");
    const show = () => (out.textContent = d.type ? "" : Number(p[d.key]).toFixed(d.step < 1 ? 2 : 0));
    input.addEventListener("input", () => {
      p[d.key] = d.type === "check" ? input.checked : Number(input.value);
      show();
      save();
    });
    show();
    row.append(Object.assign(document.createElement("span"), { textContent: d.label }), input, out);
    box.append(row);
  }
}

/* ---------- 감지 고르기 ---------- */

let sense = null;
const video = $("video");

async function useSource(kind, file) {
  sense?.stop();
  sense = null;
  $("status").textContent = "여는 중";
  try {
    sense = kind === "sim"
      ? new SimSense()
      : new CameraSense(video, { file, say: (t) => ($("status").textContent = t) });
    await sense.start();
    $("status").textContent = `${sense.source}${sense.note ? ` · ${sense.note}` : ""}`;
  } catch (e) {
    $("status").textContent = `열지 못했습니다: ${e.message || e}. 「가짜 관객」으로 바꿔 흐름부터 볼 수 있습니다`;
    sense = new SimSense();
  }
}

$("source").addEventListener("change", (e) => {
  const v = e.target.value;
  if (v === "file") $("file").click();
  else useSource(v);
});
$("file").addEventListener("change", (e) => e.target.files[0] && useSource("file", e.target.files[0]));

/* ---------- 소리 ---------- */

const art = new Art();
const sound = new Sound(art);
$("sound").addEventListener("click", async () => {
  if (sound.on) {
    sound.stop();
    $("sound").textContent = "소리 켜기";
    $("sound").classList.remove("on");
    return;
  }
  try {
    await sound.start();
    for (let i = 0; i < turn.turn; i++) sound.add(i);   // 이미 쌓인 만큼 되살린다
    $("sound").textContent = "소리 끄기";
    $("sound").classList.add("on");
  } catch (e) {
    $("status").textContent = `소리를 열지 못했습니다: ${e.message || e}`;
  }
});

/* ---------- 기록 ---------- */

const canvas = () => document.querySelector("#stage canvas");
let recorder = null;
function stamp() {
  const d = new Date();
  const z = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`;
}
function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
function toggleRecord() {
  if (recorder) { recorder.stop(); return; }
  const type = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"].find((t) =>
    window.MediaRecorder?.isTypeSupported?.(t)
  );
  if (!type) { $("status").textContent = "이 브라우저는 화면 녹화를 지원하지 않습니다"; return; }
  const chunks = [];
  recorder = new MediaRecorder(canvas().captureStream(30), { mimeType: type });
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = () => {
    download(new Blob(chunks, { type }), `dancereply-${stamp()}.${type.includes("mp4") ? "mp4" : "webm"}`);
    recorder = null;
    $("rec").textContent = "녹화 시작";
    $("rec").classList.remove("on");
  };
  recorder.start(1000);
  $("rec").textContent = "녹화 멈추고 저장";
  $("rec").classList.add("on");
}
$("rec").addEventListener("click", toggleRecord);
$("snap").addEventListener("click", () => canvas().toBlob((b) => download(b, `dancereply-${stamp()}.png`)));
$("only").addEventListener("click", () => document.body.classList.toggle("display"));
$("again").addEventListener("click", restart);
$("reset").addEventListener("click", () => {
  for (const d of PARAMS) p[d.key] = d.value;
  save();
  buildPanel();
});
function restart() {
  turn.turn = 0;
  turn.go("idle");
  scene.clear();
  sound.clear();
}
addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  const k = e.key.toLowerCase();
  if (e.code === "Space") { e.preventDefault(); restart(); }
  if (k === "h") document.body.classList.toggle("display");
  if (k === "f") document.fullscreenElement ? document.exitFullscreen() : $("stage").requestFullscreen?.();
  if (k === "r") toggleRecord();
});

/* 전시 중에 화면이 저절로 꺼지면 안 된다. 되는 브라우저에서만 막는다. */
let wake = null;
async function keepAwake() {
  try {
    if (!wake && navigator.wakeLock) {
      wake = await navigator.wakeLock.request("screen");
      wake.addEventListener("release", () => (wake = null));
    }
  } catch {}
}
addEventListener("pointerdown", keepAwake);
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && keepAwake());

/* ---------- 한 프레임 ---------- */

const motion = new Motion();
const turn = new Turn();
const alien = new Alien(art);
const scene = new Scene(art);
const prev = $("preview");
const pctx = prev.getContext("2d");
let state = { phase: "idle", turn: 0, progress: 0, added: 0, at: { x: 0.5, y: 0.5 }, answering: 0 };
let m = { amount: 0, x: 0.5, y: 0.5, spread: 0, high: 0, still: 0 };
let last = performance.now();

function meter(id, v, t) {
  $(`m-${id}`).style.width = `${Math.min(1, Math.abs(v)) * 100}%`;
  $(`v-${id}`).textContent = t;
}

new p5((sk) => {
  sk.setup = async () => {
    const parent = $("stage");
    const c = sk.createCanvas(parent.clientWidth, parent.clientHeight);
    c.parent(parent);
    sk.textFont("system-ui");
    await art.load(sk);
    $("artnote").textContent = art.note;
  };

  sk.windowResized = () => sk.resizeCanvas($("stage").clientWidth, $("stage").clientHeight);

  sk.draw = () => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;

    if (sense) {
      const frame = sense.read(now);
      m = motion.read(frame, dt);
      state = turn.step(dt, frame, m, p);
      if (state.added) {
        // 화면을 거울처럼 뒤집어 보여 주면 그림도 관객이 움직인 쪽에 피어나야 한다
        const at = p.mirror ? { x: 1 - state.at.x, y: state.at.y } : state.at;
        scene.add(state.added, at, now);
        if (p.sound) sound.add(turn.turn - 1);
      }
      if (state.phase === "idle" && scene.things.length && turn.t < dt * 2) {
        scene.clear();
        sound.clear();
      }
      drawPreview(frame);
    }

    // 바탕. 주고받을수록 조금씩 밝아진다. 세계가 차오르는 느낌을 바탕에서도 준다
    const warm = state.progress;
    sk.background(10 + warm * 18, 13 + warm * 20, 20 + warm * 26);
    scene.draw(sk, p, now);
    alien.draw(sk, state, p, dt);
    if (p.guide) drawGuide(sk);

    if (!document.body.classList.contains("display")) {
      meter("amount", m.amount, m.amount.toFixed(2));
      meter("answer", state.answering / Math.max(0.1, p.answerHold), state.answering.toFixed(1));
      meter("spread", m.spread, m.spread.toFixed(2));
      meter("turn", state.progress, `${state.turn}`);
      $("phase").textContent = { idle: "기다림", greet: "인사", call: "외계인이 말하는 중",
        wait: "관객의 차례", reply: "답을 받음", full: "세계가 가득" }[state.phase] || state.phase;
      $("fps").textContent = `${Math.round(sk.frameRate())} fps`;
    }
  };

  /* 안내 글. 전시에서 지킴이 없이도 참여할 수 있게 한 줄만 띄운다 */
  function drawGuide(sk) {
    const text = GUIDE[state.phase];
    if (!text) return;
    sk.push();
    sk.noStroke();
    sk.fill(236, 243, 255, 190);
    sk.textAlign(sk.CENTER, sk.CENTER);
    sk.textSize(Math.max(14, sk.height * 0.032));
    sk.text(text, sk.width / 2, sk.height * 0.9);
    sk.pop();
  }
}, undefined);

function drawPreview(frame) {
  if (document.body.classList.contains("display")) return;
  const W = prev.width, H = prev.height;
  pctx.save();
  if (p.mirror) { pctx.translate(W, 0); pctx.scale(-1, 1); }
  pctx.drawImage(frame.image, 0, 0, W, H);
  if (frame.pts) {
    pctx.fillStyle = "#9fe3ff";
    for (const i of [15, 16]) {
      const q = frame.pts[i];
      if (!q || q.v < 0.4) continue;
      pctx.beginPath();
      pctx.arc(q.x * W, q.y * H, 6, 0, Math.PI * 2);
      pctx.fill();
    }
  }
  pctx.restore();
}

/* ---------- 시작 ---------- */

buildPanel();
if (url.has("display")) document.body.classList.add("display");
if (url.get("video")) {
  $("source").value = "file";
  useSource("file", url.get("video"));
} else {
  const start = url.has("sim") ? "sim" : "camera";
  $("source").value = start;
  useSource(start);
}

/* ./start.sh --offline N. 장비 없이 N초를 녹화해 serve.py 에 보낸다. 검증용. */
const offline = Number(url.get("offline") || 0);
if (offline > 0) {
  setTimeout(() => {
    const type = ["video/mp4;codecs=avc1", "video/mp4", "video/webm"].find((t) => window.MediaRecorder?.isTypeSupported?.(t));
    if (!type) { $("status").textContent = "이 브라우저는 녹화를 지원하지 않습니다"; return; }
    const chunks = [];
    const rec = new MediaRecorder(canvas().captureStream(30), { mimeType: type });
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      const ext = type.includes("mp4") ? "mp4" : "webm";
      try {
        await fetch(`save?ext=${ext}`, { method: "POST", body: new Blob(chunks, { type }) });
        $("status").textContent = `out.${ext} 로 적었습니다. 이 창은 닫아도 됩니다`;
      } catch {
        download(new Blob(chunks, { type }), `out.${ext}`);
      }
    };
    $("status").textContent = `${offline}초 녹화 중`;
    rec.start(1000);
    setTimeout(() => rec.stop(), offline * 1000);
  }, 2000);
}

window.dancereply = { p, turn, scene, sound, art, get motion() { return m; }, get state() { return state; } };
