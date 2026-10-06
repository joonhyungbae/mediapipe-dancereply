/*
 움직임의 성격. 「얼마나 움직였나」 하나가 아니라, 어떤 춤이었는지를 여섯 가지로 읽는다.

 이 작품은 남의 몸짓을 자세히 들여다보는 이야기다. 그래서 움직임의 양만 세지 않고,
 빠르기와 크기와 결을 따로 읽는다. 읽은 것은 외계인의 다음 춤과, 피어나는 그림과, 쌓이는
 소리에 모두 쓰인다. 관객의 춤이 세계의 생김새가 되는 자리다.

 매 프레임 내보내는 것
   amount   지금 얼마나 움직이고 있나 0~1
   x, y     움직임이 일어난 자리. 그림이 거기에서 피어난다

 한 번의 답을 읽어 내보내는 것 (summary)
   tempo      빠르기. 1초에 몇 번 꺾였나 0~1
   size       크기. 손이 몸에서 얼마나 멀리까지 갔나 0~1
   sharp      결. 속도가 갑자기 바뀔수록 1(날카롭다), 고르게 흐르면 0(부드럽다)
   vertical   위아래로 움직였나(1) 좌우로 움직였나(0)
   symmetry   두 팔이 같이 움직였나(1) 한쪽만 썼나(0)
   open       두 손이 벌어졌나 0~1

 어느 것도 「맞다 틀리다」가 아니다. 다르게 춘 것이 다르게 읽힐 뿐이다.
*/

import { MOTION_SMOOTH, QUALITY_WINDOW } from "./settings.js";

const WATCH = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const LEFT = [13, 15, 25, 27];
const RIGHT = [14, 16, 26, 28];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export class Quality {
  constructor() {
    this.prev = null;
    this.amount = 0;
    this.x = 0.5;
    this.y = 0.5;
    this.still = 0;
    this.log = [];       // 창 안의 기록 {t, speed, dx, dy, left, right, reach, open}
    this.last = this.blank();
  }

  blank() {
    return { amount: 0, tempo: 0.4, size: 0.4, sharp: 0.4, vertical: 0.5, symmetry: 0.7, open: 0.4 };
  }

  read(frame, dt, now) {
    const pts = frame.pts;
    if (!pts) {
      this.amount += (0 - this.amount) * MOTION_SMOOTH;
      this.still += dt;
      return this.frame();
    }

    // 몸 크기. 어깨 너비와 어깨에서 엉덩이까지를 더해 쓴다. 멀리 선 사람도 같은 값이 되게 한다
    const span = Math.hypot(pts[11].x - pts[12].x, pts[11].y - pts[12].y);
    const torso = Math.abs((pts[23].y + pts[24].y) / 2 - (pts[11].y + pts[12].y) / 2);
    const size = Math.max(0.05, span + torso);

    let moved = 0, dx = 0, dy = 0, left = 0, right = 0, wx = 0, wy = 0, weight = 0;
    if (this.prev) {
      for (const i of WATCH) {
        const a = pts[i], b = this.prev[i];
        if (!a || !b || a.v < 0.4) continue;
        const ax = Math.abs(a.x - b.x) / size;
        const ay = Math.abs(a.y - b.y) / size;
        const d = Math.hypot(a.x - b.x, a.y - b.y) / size;
        moved += d;
        dx += ax;
        dy += ay;
        if (LEFT.includes(i)) left += d;
        if (RIGHT.includes(i)) right += d;
        wx += a.x * d;
        wy += a.y * d;
        weight += d;
      }
      moved /= WATCH.length;
      if (weight > 1e-4) {
        this.x = wx / weight;
        this.y = wy / weight;
      }
    }
    this.prev = pts.map((p) => ({ x: p.x, y: p.y, v: p.v }));

    const speed = dt > 0 ? moved / dt : 0;
    this.amount += (clamp(speed * 0.6) - this.amount) * MOTION_SMOOTH;
    this.still = this.amount < 0.02 ? this.still + dt : 0;

    // 손이 몸 가운데에서 얼마나 멀리 갔나, 두 손이 얼마나 벌어졌나
    const mid = { x: (pts[11].x + pts[12].x) / 2, y: (pts[11].y + pts[12].y) / 2 };
    const reach = [15, 16].reduce(
      (m, i) => Math.max(m, pts[i] && pts[i].v > 0.3 ? Math.hypot(pts[i].x - mid.x, pts[i].y - mid.y) / size : 0),
      0
    );
    const open = pts[15] && pts[16] ? Math.hypot(pts[15].x - pts[16].x, pts[15].y - pts[16].y) / Math.max(0.02, span * 5) : 0;

    this.log.push({ t: now / 1000, speed, dx, dy, left, right, reach, open });
    const cut = now / 1000 - QUALITY_WINDOW;
    while (this.log.length && this.log[0].t < cut) this.log.shift();

    return this.frame();
  }

  frame() {
    return { amount: this.amount, x: this.x, y: this.y, still: this.still };
  }

  /* 방금의 답을 읽는다. 창 안의 기록이 모자라면 직전에 읽은 것을 그대로 쓴다 */
  summary() {
    if (this.log.length < 6) return this.last;
    const n = this.log.length;
    const speeds = this.log.map((s) => s.speed);
    const seconds = Math.max(0.3, this.log[n - 1].t - this.log[0].t);

    // 빠르기. 속도가 봉우리를 몇 번 만들었나. 1초에 세 번이면 빠른 춤이다
    let peaks = 0;
    const floor = Math.max(0.05, speeds.reduce((a, b) => a + b, 0) / n * 0.8);
    for (let i = 1; i < n - 1; i++) {
      if (speeds[i] > floor && speeds[i] >= speeds[i - 1] && speeds[i] > speeds[i + 1]) peaks++;
    }
    const tempo = clamp((peaks / seconds) / 3);

    // 결. 속도가 갑자기 바뀔수록 날카롭다
    let jerk = 0;
    for (let i = 1; i < n; i++) jerk += Math.abs(speeds[i] - speeds[i - 1]);
    const mean = speeds.reduce((a, b) => a + b, 0) / n;
    const sharp = clamp((jerk / n) / Math.max(0.02, mean) * 1.2);

    const sum = (key) => this.log.reduce((a, s) => a + s[key], 0);
    const dx = sum("dx"), dy = sum("dy");
    const left = sum("left"), right = sum("right");

    const out = {
      amount: clamp(mean * 0.6),
      tempo,
      size: clamp(this.log.reduce((m, s) => Math.max(m, s.reach), 0) / 1.7),
      sharp,
      vertical: clamp(dy / Math.max(1e-4, dx + dy)),
      symmetry: 1 - clamp(Math.abs(left - right) / Math.max(1e-4, left + right)),
      open: clamp(this.log.reduce((m, s) => Math.max(m, s.open), 0)),
    };
    this.last = out;
    return out;
  }

  /* 읽은 것을 사람의 말로. 화면과 조절판에 그대로 띄운다 */
  static words(q) {
    const say = [];
    say.push(q.tempo > 0.6 ? "빠르게" : q.tempo < 0.25 ? "느리게" : "고르게");
    say.push(q.size > 0.6 ? "크게" : q.size < 0.3 ? "작게" : "알맞게");
    say.push(q.sharp > 0.6 ? "날카롭게" : q.sharp < 0.3 ? "부드럽게" : "담담하게");
    if (q.vertical > 0.65) say.push("위아래로");
    else if (q.vertical < 0.35) say.push("옆으로");
    if (q.symmetry < 0.4) say.push("한쪽으로");
    return say;
  }
}
