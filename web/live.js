/*
 지금 일어나는 일. 관객이 자기 움직임이 닿고 있다는 것을 알아보게 하는 자리.

 그림은 답이 끝난 뒤에야 피어난다. 그 사이에 아무 일도 일어나지 않으면 관객은 자기가
 무엇을 하고 있는지 모른다. 그래서 움직이는 동안 바로 보이는 것을 셋 둔다.

   듣는 테두리   외계인을 둘러싼 원. 관객이 움직이는 만큼 채워지고, 멈추면 줄어든다
   움직임 자국   지금 움직이는 자리에 남는 옅은 점. 몇 초 뒤 사라진다
   그림자        관객의 몸. 화면 아래쪽 띠에 선다. 외계인은 위쪽이라 둘이 마주 보는 꼴이 된다

 이것들은 작품의 그림이 아니라 말 거는 방법이다. 전시에서 빼고 싶으면 조절판에서 끈다.
*/

// 관객이 설 자리. 화면 아래쪽 띠다. 외계인은 위쪽에 서서 서로 마주 본다.
// 겹쳐 두면 그림자가 외계인 위에 얹혀 둘 다 알아보기 어렵다.
const BAND = { top: 0.52, bottom: 0.99, width: 0.52 };

export class Live {
  constructor() {
    this.trail = [];     // {x, y, t, r}
  }

  /* 카메라에서 본 자리를 관객의 띠 안으로 옮긴다. 그림자와 자국이 같은 자리를 쓴다 */
  static place(x, y, W, H, p) {
    const mx = p.mirror ? 1 - x : x;
    return {
      x: W * (0.5 + (mx - 0.5) * BAND.width),
      y: H * (BAND.top + y * (BAND.bottom - BAND.top)),
    };
  }

  /* 매 프레임. m 은 quality.js 의 프레임 숫자 */
  step(m, state, now) {
    if (state.phase !== "wait" || m.amount < 0.05) return;
    this.trail.push({ x: m.x, y: m.y, t: now, r: 0.3 + m.amount });
    if (this.trail.length > 90) this.trail.shift();
  }

  draw(sk, m, state, p, now) {
    const W = sk.width, H = sk.height;

    // 움직임 자국. 2초 동안 남는다
    if (p.marks) {
      sk.push();
      sk.noStroke();
      for (const t of this.trail) {
        const age = (now - t.t) / 1000;
        if (age > 2) continue;
        const at = Live.place(t.x, t.y, W, H, p);
        sk.fill(170, 215, 255, (1 - age / 2) * 110);
        sk.circle(at.x, at.y, Math.min(W, H) * 0.014 * t.r * (1 + age));
      }
      sk.pop();
    }

    // 듣는 테두리. 관객의 차례일 때만 나온다. 움직이면 차오른다
    if (state.phase === "wait") {
      const cx = W * 0.5, cy = H * 0.4;
      const r = Math.min(W, H) * 0.17;
      const fill = Math.min(1, state.answering / Math.max(0.1, p.answerHold));
      sk.push();
      sk.noFill();
      sk.strokeWeight(Math.max(2, Math.min(W, H) * 0.006));
      // 바탕 테두리. 숨 쉬듯 조금 커졌다 작아진다
      const breath = 1 + Math.sin(now / 700) * 0.02;
      sk.stroke(150, 190, 220, 70);
      sk.circle(cx, cy, r * 2 * breath);
      // 채워지는 쪽. 위에서 시계 방향으로 돈다
      if (fill > 0.01) {
        sk.stroke(160, 230, 255, 230);
        sk.arc(cx, cy, r * 2 * breath, r * 2 * breath, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2);
      }
      sk.pop();
    }
  }

  /* 관객의 몸. 관절을 이어 옅게 그린다. 보고 있다는 것을 알려 주는 쪽이지 작품의 그림이 아니다 */
  ghost(sk, frame, p) {
    const pts = frame.pts;
    if (!pts || !p.ghost) return;
    const W = sk.width, H = sk.height;
    const at = (q) => Live.place(q.x, q.y, W, H, p);
    sk.push();
    sk.stroke(150, 200, 235, 85);
    sk.strokeWeight(Math.max(2, Math.min(W, H) * 0.007));
    sk.strokeCap(sk.ROUND);
    sk.noFill();
    for (const [a, b] of [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24],
                          [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]]) {
      const qa = pts[a], qb = pts[b];
      if (!qa || !qb || qa.v < 0.4 || qb.v < 0.4) continue;
      const a1 = at(qa), b1 = at(qb);
      sk.line(a1.x, a1.y, b1.x, b1.y);
    }
    const head = pts[0];
    if (head && head.v > 0.4) {
      const h = at(head);
      sk.noStroke();
      sk.fill(150, 200, 235, 85);
      sk.circle(h.x, h.y, Math.min(W, H) * 0.04);
    }
    sk.pop();
  }

  clear() {
    this.trail = [];
  }
}
