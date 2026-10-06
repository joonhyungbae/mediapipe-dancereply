/*
 감지. 카메라에 비친 사람의 관절 자리.

 매 프레임 내보내는 것
   present  사람이 있나
   pts      관절 33개 {x, y, v}. x·y 는 화면 비율(0~1), v 는 믿을 만한 정도

 이 작품은 관절의 모양이 아니라 「얼마나 움직였나」를 본다. 그 숫자를 만드는 일은
 motion.js 가 한다. 여기서는 관절만 내보낸다.

 카메라가 없으면 「가짜 관객」으로 돌린다. 장비 없이 대화의 흐름을 먼저 보라고 둔 것이다.
 관절은 MediaPipe Pose Landmarker 가 뽑는다(Apache-2.0). 인터넷에서 아무것도 불러오지 않는다.
*/

import { INPUT_WIDTH, MAX_PEOPLE } from "./settings.js";

// 사람을 찾는 그림의 크기. 클수록 정확하고 느리다. 라즈베리파이에서 느리면 주소에 ?in=256 처럼 줄인다.
const IN_W = Math.max(128, Math.min(640, Number(new URLSearchParams(location.search).get("in")) || INPUT_WIDTH));
const IN_H = Math.round((IN_W * 3) / 4);

async function exists(url) {
  try {
    const r = await fetch(url, { method: "HEAD" });
    return r.ok;
  } catch {
    return false;
  }
}

// 라이브러리는 저장소에 들어 있고(web/vendor/mediapipe), 모델은 설치할 때 web/models/ 에 받는다.
// 둘 다 index.html 기준 경로다. 이 파일(sense.js) 기준으로 부르면 다른 곳을 찾는다.
const LIB = new URL("vendor/mediapipe", document.baseURI).href;
const MODEL = new URL("models/pose_landmarker_lite.task", document.baseURI).href;

async function loadLandmarker(numPoses, say) {
  if (!(await exists(MODEL))) {
    throw new Error("사람을 찾는 모델이 없습니다. 터미널에서 python3 fetch_model.py 를 한 번 실행하세요");
  }
  say("MediaPipe 를 여는 중");
  const vision = await import(`${LIB}/vision_bundle.mjs`);
  const fileset = await vision.FilesetResolver.forVisionTasks(`${LIB}/wasm`);
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode: "VIDEO",
    numPoses,
    outputSegmentationMasks: false,   // 이 예제는 관절만 쓴다. 켜면 느려진다
  });
  // 기본은 CPU 다. GPU 로 돌리면 관절은 잡히는데 실루엣이 비어 나오는 기계가 있었다.
  // 주소에 ?gpu 를 붙이면 GPU 로 해 본다. 실루엣이 붉게 안 칠해지면 다시 빼면 된다.
  const how = new URLSearchParams(location.search).has("gpu") ? "GPU" : "CPU";
  return { lm: await vision.PoseLandmarker.createFromOptions(fileset, options(how)), how };
}

/* 카메라나 영상 파일에서 실루엣을 뽑는다. */
export class CameraSense {
  constructor(video, { numPoses = MAX_PEOPLE, file = null, deviceId = null, camLabel = null, say = () => {} } = {}) {
    this.video = video;
    this.numPoses = numPoses;
    this.file = file;
    this.deviceId = deviceId;
    this.camLabel = camLabel;
    this.say = say;
    this.source = file ? "영상 파일" : "카메라";
    this.input = document.createElement("canvas");
    this.input.width = IN_W;
    this.input.height = IN_H;
    this.ictx = this.input.getContext("2d", { willReadFrequently: true });
    this.frame = { present: false, pts: null, image: this.input };
    this.fps = 0;
    this._last = 0;
    this._lastTs = -1;
  }

  async start() {
    if (this.file) {
      // 고른 파일이거나 ?video= 로 준 주소다
      this.video.src = typeof this.file === "string" ? this.file : URL.createObjectURL(this.file);
      this.video.loop = true;
      this.video.muted = true;
    } else {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("이 브라우저에서는 카메라를 열 수 없습니다. 주소가 localhost 이거나 https 여야 합니다");
      }
      const video = { width: 640, height: 480 };
      if (this.deviceId) video.deviceId = { exact: this.deviceId };
      this.video.srcObject = await navigator.mediaDevices.getUserMedia({ video, audio: false });
      // ?cam=USB 처럼 이름 일부를 주면 그 카메라로 바꾼다. 이름은 권한을 받은 뒤에야 보인다.
      if (this.camLabel && !this.deviceId) {
        const want = this.camLabel.toLowerCase();
        const cams = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
        const hit = cams.find((d) => d.label.toLowerCase().includes(want));
        const now = this.video.srcObject.getVideoTracks()[0]?.getSettings().deviceId;
        if (hit && hit.deviceId !== now) {
          this.video.srcObject.getTracks().forEach((t) => t.stop());
          video.deviceId = { exact: hit.deviceId };
          this.video.srcObject = await navigator.mediaDevices.getUserMedia({ video, audio: false });
        }
        this.source = hit ? `카메라: ${hit.label}` : `카메라 (「${this.camLabel}」를 찾지 못해 기본 카메라)`;
      }
    }
    await this.video.play();
    const { lm, how } = await loadLandmarker(this.numPoses, this.say);
    this.lm = lm;
    this.note = `MediaPipe · ${how} · 입력 ${IN_W}×${IN_H}`;
  }

  stop() {
    const s = this.video.srcObject;
    if (s) s.getTracks().forEach((t) => t.stop());
    this.video.srcObject = null;
    this.lm?.close();
  }

  /* 새 프레임이 있으면 감지해서 this.frame 을 갈아 끼운다. */
  read(now) {
    const v = this.video;
    if (!this.lm || v.readyState < 2) return this.frame;
    // 영상 시간이 그대로면 같은 그림이다. 다시 볼 필요가 없다.
    if (v.currentTime === this._lastTs && !this.file) return this.frame;
    this._lastTs = v.currentTime;

    // 화면 비율이 달라도 가운데를 4:3 으로 잘라 넣는다.
    const vw = v.videoWidth, vh = v.videoHeight;
    const want = IN_W / IN_H;
    let sw = vw, sh = vh;
    if (vw / vh > want) sw = vh * want;
    else sh = vw / want;
    this.ictx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, IN_W, IN_H);

    this.lm.detectForVideo(this.input, now, (res) => {
      const first = (res.landmarks || [])[0];
      const pts = first ? first.map((p) => ({ x: p.x, y: p.y, v: p.visibility ?? 1 })) : null;
      this.frame = { present: !!pts, pts, image: this.input };
    });

    const dt = now - this._last;
    if (dt > 0) this.fps = this.fps * 0.9 + (1000 / dt) * 0.1;
    this._last = now;
    return this.frame;
  }
}

/* 가짜 관객. 카메라 없이 대화의 흐름을 보려고 둔다. 가만히 있다가 가끔 춤춘다. */
export class SimSense {
  constructor() {
    this.source = "가짜 관객";
    this.note = "카메라 없이 가끔 춤추는 중";
    this.canvas = document.createElement("canvas");
    this.canvas.width = 320;
    this.canvas.height = 240;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.fps = 60;
    this.frame = { present: true, pts: null, image: this.canvas };
    this.until = 0;       // 이 시각까지 춤춘다
    this.next = 2;        // 다음에 춤출 시각
  }

  async start() {}
  stop() {}

  /* 사람이 춤추는 것처럼 관절을 움직인다. 쉬는 동안에는 거의 가만히 있는다. */
  read(now) {
    const t = now / 1000;
    if (t > this.next) {
      this.until = t + 1.5 + Math.random() * 2;
      this.next = this.until + 2 + Math.random() * 4;
    }
    const dancing = t < this.until;
    const beat = dancing ? Math.sin(t * 6.5) : 0;
    const sway = dancing ? Math.sin(t * 3.1) : Math.sin(t * 0.4) * 0.05;

    const P = (x, y) => ({ x: 0.5 + x, y, v: 1 });
    const pts = new Array(33).fill(null).map(() => P(0, 0.5));
    pts[0] = P(sway * 0.03, 0.2 - Math.abs(beat) * 0.01);                 // 코
    pts[11] = P(-0.08 + sway * 0.02, 0.32); pts[12] = P(0.08 + sway * 0.02, 0.32);
    pts[13] = P(-0.15 - beat * 0.04, 0.42 - beat * 0.08);                 // 팔꿈치
    pts[14] = P(0.15 + beat * 0.04, 0.42 + beat * 0.08);
    pts[15] = P(-0.2 - beat * 0.08, 0.5 - beat * 0.22);                   // 손목
    pts[16] = P(0.2 + beat * 0.08, 0.5 + beat * 0.22);
    pts[23] = P(-0.06 + sway * 0.03, 0.6); pts[24] = P(0.06 + sway * 0.03, 0.6);
    pts[25] = P(-0.07, 0.75); pts[26] = P(0.07, 0.75);
    pts[27] = P(-0.08, 0.9); pts[28] = P(0.08, 0.9);

    // 미리보기에 쓸 그림 한 장
    const c = this.ctx, W = this.canvas.width, H = this.canvas.height;
    c.fillStyle = "#11131a";
    c.fillRect(0, 0, W, H);
    c.strokeStyle = dancing ? "#9fe3ff" : "#5a6a76";
    c.lineWidth = 5;
    c.lineCap = "round";
    const L = (a, b) => {
      c.beginPath();
      c.moveTo(pts[a].x * W, pts[a].y * H);
      c.lineTo(pts[b].x * W, pts[b].y * H);
      c.stroke();
    };
    for (const [a, b] of [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24],
                          [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]]) L(a, b);
    c.fillStyle = c.strokeStyle;
    c.beginPath();
    c.arc(pts[0].x * W, pts[0].y * H, 14, 0, Math.PI * 2);
    c.fill();

    this.frame = { present: true, pts, image: this.canvas };
    return this.frame;
  }
}
