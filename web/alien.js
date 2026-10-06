/*
 외계인. 먼저 말을 거는 쪽이다.

 작가의 그림이 들어오기 전까지는 자리표시자 도형으로 춘다. 둥근 몸 하나와 팔 둘, 눈 하나다.
 작가의 그림이 들어오면 art/alien*.png 를 순서대로 넘기며 춘다(그림 넘기기 방식).

 춤은 세 가지 몸짓을 섞어 만든다. 흔들기, 뛰기, 팔 벌리기다. 주고받을수록 조금씩 커진다.
 사람의 춤을 흉내 내지 않는다. 낯선 존재로 보여야 관객이 따라 하지 않고 자기 춤으로 답한다.
*/

export class Alien {
  constructor(art) {
    this.art = art;
    this.phase = 0;
  }

  /* 지금 얼마나 크게 추고 있나. 말하는 중이 아니면 거의 가만히 있다 */
  energy(state) {
    if (state.phase === "call" || state.phase === "greet") return 1;
    if (state.phase === "reply") return 0.5;
    return 0.12;   // 듣는 중에도 아주 조금은 흔들린다
  }

  draw(sk, state, p, dt) {
    const e = this.energy(state);
    this.phase += dt * (1 + e * 5);

    const W = sk.width, H = sk.height;
    const unit = Math.min(W, H) * 0.14 * (1 + state.progress * 0.25);
    const cx = W * 0.5 + Math.sin(this.phase * 0.9) * unit * 0.5 * e;
    const cy = H * 0.52 - Math.abs(Math.sin(this.phase * 1.7)) * unit * 0.35 * e;
    const open = (0.6 + Math.sin(this.phase * 1.3) * 0.4) * e;   // 팔 벌림

    sk.push();
    sk.noStroke();
    // 발밑 그림자
    sk.fill(0, 0, 0, 60);
    sk.ellipse(cx, H * 0.52 + unit * 1.25, unit * 1.3, unit * 0.22);

    // 작가의 그림이 있으면 그것을 넘기며 춘다. 없으면 아래의 자리표시자 도형으로
    const img = this.art?.alien(this.phase * 2);
    if (img) {
      sk.imageMode(sk.CENTER);
      const ratio = img.height / Math.max(1, img.width);
      sk.image(img, cx, cy, unit * 2.2, unit * 2.2 * ratio);
      sk.pop();
      return;
    }

    // 팔
    sk.stroke(226, 240, 255, 230);
    sk.strokeWeight(unit * 0.16);
    sk.strokeCap(sk.ROUND);
    for (const side of [-1, 1]) {
      const ex = cx + side * unit * (0.55 + open * 0.55);
      const ey = cy - unit * open * 0.8;
      sk.line(cx + side * unit * 0.35, cy, ex, ey);
    }
    sk.noStroke();

    // 몸
    sk.fill(214, 236, 255, 240);
    sk.ellipse(cx, cy, unit * 1.25, unit * 1.5 - Math.sin(this.phase * 1.7) * unit * 0.12 * e);
    // 눈 하나. 말할 때는 커지고 들을 때는 가늘어진다
    const eye = unit * (state.phase === "wait" ? 0.14 : 0.2);
    sk.fill(22, 28, 40);
    sk.ellipse(cx, cy - unit * 0.12, eye * 1.5, eye);
    sk.fill(255);
    sk.ellipse(cx + eye * 0.25, cy - unit * 0.16, eye * 0.4, eye * 0.35);
    sk.pop();
  }
}
