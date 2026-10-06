/*
 움직임. 관절 자리에서 「얼마나, 어디서, 어떻게 움직였나」를 뽑는다.

 이 작품은 춤의 모양을 알아맞히지 않는다. 어떤 춤이든 답으로 받아들이는 것이 작품의 뜻이라,
 정해진 동작을 맞혔는지 보지 않고 움직임의 양과 자리만 본다.

 매 프레임 내보내는 것
   amount   얼마나 움직였나 0~1. 관절이 한 프레임에 움직인 거리를 몸 크기로 나눈 값
   x, y     움직임이 일어난 자리. 화면 비율(0~1). 그림이 거기에 피어난다
   spread   두 손이 얼마나 벌어졌나 0~1
   high     두 손이 얼마나 높이 있나 0~1

 몸 크기로 나눠 두는 것이 중요하다. 그러지 않으면 카메라에 가까운 사람만 크게 움직인 것이
 되고, 멀리 선 사람은 아무리 춰도 답으로 받아들여지지 않는다.
*/

import { MOTION_SMOOTH } from "./settings.js";

// 쓰는 관절만 본다. 얼굴의 잔 떨림까지 세면 가만히 있어도 움직인 것이 된다
const WATCH = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
const HANDS = [15, 16];

export class Motion {
  constructor() {
    this.prev = null;
    this.amount = 0;
    this.x = 0.5;
    this.y = 0.5;
    this.spread = 0;
    this.high = 0;
    this.still = 0;      // 움직이지 않은 시간(초)
  }

  read(frame, dt) {
    const pts = frame.pts;
    if (!pts) {
      this.amount += (0 - this.amount) * MOTION_SMOOTH;
      this.still += dt;
      return this.out();
    }

    // 몸 크기. 어깨 너비와 어깨에서 엉덩이까지를 더해 쓴다
    const span = Math.hypot(pts[11].x - pts[12].x, pts[11].y - pts[12].y);
    const torso = Math.abs((pts[23].y + pts[24].y) / 2 - (pts[11].y + pts[12].y) / 2);
    const size = Math.max(0.05, span + torso);

    let moved = 0, wx = 0, wy = 0, weight = 0;
    if (this.prev) {
      for (const i of WATCH) {
        const a = pts[i], b = this.prev[i];
        if (!a || !b || a.v < 0.4) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y) / size;
        moved += d;
        // 많이 움직인 관절 쪽으로 자리를 당긴다. 손을 흔들면 손 쪽에 그림이 생긴다
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

    // 한 프레임에 움직인 양을 1초치로 환산한다. 프레임이 느려도 같은 값이 나오게 한다
    const perSecond = dt > 0 ? moved / dt : 0;
    const now = Math.min(1, perSecond * 0.6);
    this.amount += (now - this.amount) * MOTION_SMOOTH;
    this.still = this.amount < 0.02 ? this.still + dt : 0;

    const hands = HANDS.map((i) => pts[i]).filter((p) => p && p.v > 0.3);
    if (hands.length === 2) {
      this.spread = Math.min(1, Math.hypot(hands[0].x - hands[1].x, hands[0].y - hands[1].y) / (span * 4));
      const shoulderY = (pts[11].y + pts[12].y) / 2;
      this.high = Math.min(1, Math.max(0, (shoulderY - (hands[0].y + hands[1].y) / 2) / torso + 0.3));
    }
    return this.out();
  }

  out() {
    return { amount: this.amount, x: this.x, y: this.y, spread: this.spread, high: this.high, still: this.still };
  }
}
