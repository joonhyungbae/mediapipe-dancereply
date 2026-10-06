/*
 외계인. 먼저 말을 거는 쪽이다.

 phrase.js 가 지은 문장을 몸으로 춘다. 몸짓마다 움직이는 방식이 다르고, 빠르기와 크기는
 관객의 답에서 물려받는다. 사람의 춤을 흉내 내지는 않는다. 낯선 존재로 보여야 관객이
 따라 하지 않고 자기 춤으로 답한다.

 작가의 그림이 들어오면(art/alien*.png) 그 그림을 넘기며 춘다. 그림이 없는 동안에는
 아래의 자리표시자 도형으로 춘다. 둥근 몸 하나와 팔 둘, 눈 하나다.
*/

export class Alien {
  constructor(art) {
    this.art = art;
    this.phase = 0;
    this.lean = 0;      // 기울기. 몸짓이 바뀌어도 한 번에 꺾이지 않게 뒤따라간다
    this.hop = 0;
    this.open = 0;
    this.spin = 0;
  }

  /* 지금 추고 있는 몸짓에 따라 몸의 네 가지 값을 움직인다 */
  step(state, dt) {
    const m = state.phase === "call" || state.phase === "greet" ? state.motif : null;
    const speed = m ? 0.6 + m.speed * 2.4 : 0.25;
    this.phase += dt * speed * 3;

    const want = { lean: 0, hop: 0, open: m ? 0.15 : 0.1, spin: this.spin };
    if (m) {
      const big = m.size;
      if (m.kind === "sway") want.lean = Math.sin(this.phase) * big;
      else if (m.kind === "hop") want.hop = Math.abs(Math.sin(this.phase)) * big;
      else if (m.kind === "open") want.open = (0.2 + Math.abs(Math.sin(this.phase * 0.7)) * 0.8) * big;
      else if (m.kind === "spin") want.spin = this.spin + dt * speed * 2.2;
      else if (m.kind === "hold") want.open = 0.12;
    } else if (state.phase === "wait") {
      // 듣는 중. 숨만 쉬고 몸은 관객 쪽으로 조금 기운다
      want.lean = Math.sin(this.phase * 0.3) * 0.12;
      want.open = 0.1;
    }

    const follow = 1 - Math.exp(-dt / 0.14);
    this.lean += (want.lean - this.lean) * follow;
    this.hop += (want.hop - this.hop) * follow;
    this.open += (want.open - this.open) * follow;
    // 돌기가 끝나면 앞을 보고 선다. 그러지 않으면 등을 보인 채로 멈춘다
    if (!m || m.kind !== "spin") {
      const front = Math.round(this.spin / (Math.PI * 2)) * Math.PI * 2;
      this.spin += (front - this.spin) * (1 - Math.exp(-dt / 0.25));
    } else {
      this.spin = want.spin;
    }
  }

  draw(sk, state, p, dt) {
    this.step(state, dt);
    const W = sk.width, H = sk.height;
    const unit = Math.min(W, H) * 0.14 * (1 + state.progress * 0.25);
    const cx = W * 0.5 + this.lean * unit * 1.1;
    const cy = H * 0.52 - this.hop * unit * 0.9;
    // 돌 때는 몸이 좁아 보인다. 한 바퀴 도는 것을 옆으로 눌러서 흉내 낸다
    const turn = Math.abs(Math.cos(this.spin));
    const facing = Math.cos(this.spin) < 0 ? -1 : 1;

    sk.push();
    sk.noStroke();
    sk.fill(0, 0, 0, 60);
    sk.ellipse(cx, H * 0.52 + unit * 1.25, unit * 1.3 * (0.6 + turn * 0.4), unit * 0.22);

    const img = this.art?.alien(this.phase * 0.6);
    if (img) {
      sk.imageMode(sk.CENTER);
      sk.push();
      sk.translate(cx, cy);
      sk.scale(facing * (0.35 + turn * 0.65), 1);
      const ratio = img.height / Math.max(1, img.width);
      sk.image(img, 0, 0, unit * 2.2, unit * 2.2 * ratio);
      sk.pop();
      sk.pop();
      return;
    }

    // 팔. 펼치기 값이 클수록 넓고 높이 든다
    sk.stroke(226, 240, 255, 230);
    sk.strokeWeight(unit * 0.16);
    sk.strokeCap(sk.ROUND);
    for (const side of [-1, 1]) {
      const reach = unit * (0.5 + this.open * 0.9) * (0.35 + turn * 0.65);
      const ex = cx + side * reach * facing;
      const ey = cy - unit * this.open * 0.9;
      sk.line(cx + side * unit * 0.3 * turn * facing, cy, ex, ey);
    }
    sk.noStroke();

    // 몸. 뛰면 눌렸다 늘어난다
    sk.fill(214, 236, 255, 240);
    const squash = 1 + this.hop * 0.18;
    sk.ellipse(cx, cy, unit * 1.25 * (0.35 + turn * 0.65), unit * 1.5 * squash);

    // 눈 하나. 말할 때는 크고 들을 때는 가늘어진다. 돌아서면 보이지 않는다
    if (facing > 0) {
      const eye = unit * (state.phase === "wait" ? 0.13 : 0.2);
      sk.fill(22, 28, 40);
      sk.ellipse(cx + this.lean * unit * 0.2, cy - unit * 0.12, eye * 1.5 * turn, eye);
      sk.fill(255);
      sk.ellipse(cx + eye * 0.25, cy - unit * 0.16, eye * 0.4 * turn, eye * 0.35);
    }
    sk.pop();
  }
}
