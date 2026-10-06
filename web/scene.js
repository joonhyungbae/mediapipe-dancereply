/*
 세계. **이 파일이 작가가 고칠 두 번째 자리다.** (첫 번째는 turn.js)

 답할 때마다 그림이 한 장씩 피어나 쌓인다. 어디에 어떻게 피어나는지가 이 파일이다.

 지금의 규칙
   관객이 움직인 쪽에서 피어나되, 이미 그림이 있는 자리와 외계인이 선 자리는 피한다
   그림 한 장이 그 답의 성격을 입는다. 크게 춘 답은 크게, 빠른 답은 빨리 피어나고,
   날카로운 답은 또렷하게, 부드러운 답은 느리게 번진다. 쌓인 세계가 그 사람의 춤이 된다
   피어날 때 작게 시작해 제 크기로 커지고, 한 번 흔들린 뒤 멈춘다
   먼저 나온 그림은 조금 뒤로 물러난다(작고 옅게). 쌓인 순서가 보이게 하려는 것이다
   작가의 그림이 없으면 자리표시자 도형이 대신 나온다

 바꿔 볼 것
   자리. 움직인 자리가 아니라 바닥에서부터 차오르게 하거나, 외계인 둘레를 돌게 할 수 있다
   남는 시간. 지금은 지우지 않고 끝까지 쌓인다. 오래된 것부터 옅어지게 할 수도 있다
   겹치는 순서. 새 그림을 앞에 둘지 뒤에 둘지에 따라 세계가 자라는 느낌이 달라진다
*/

export class Scene {
  constructor(art) {
    this.art = art;
    this.things = [];     // {x, y, born, seed, index}
  }

  clear() {
    this.things = [];
  }

  /* 답 한 번에 그림 몇 장을 더한다.

     자리는 관객이 움직인 쪽에서 시작하되, 이미 그림이 있는 자리와 외계인이 선 자리는 피한다.
     그러지 않으면 한자리에 선 사람의 그림이 모두 겹쳐 쌓여 세계가 자라 보이지 않는다. */
  add(count, at, now, q) {
    for (let i = 0; i < count; i++) {
      const spot = this.spot(at, q);
      this.things.push({
        x: spot.x, y: spot.y, born: now,
        seed: Math.random() * 10, index: this.things.length,
        q: q || { tempo: 0.4, size: 0.4, sharp: 0.4, vertical: 0.5, symmetry: 0.8, open: 0.4 },
      });
    }
  }

  /* 후보를 몇 군데 뽑아 가장 빈 자리를 고른다 */
  spot(at, q) {
    // 큰 그림일수록 가장자리에서 멀리 둔다. 화면 밖으로 잘리지 않게 한다
    const edge = 0.12 + (q ? q.size : 0.4) * 0.1;
    const taken = [...this.things, { x: 0.5, y: 0.4 }];    // 마지막은 외계인이 선 자리
    let best = null, bestGap = -1;
    for (let i = 0; i < 12; i++) {
      // 처음에는 움직인 자리 가까이에서, 뒤로 갈수록 멀리까지 넓혀 본다
      const reach = 0.12 + (i / 11) * 0.55;
      const a = Math.random() * Math.PI * 2;
      const x = Math.min(1 - edge, Math.max(edge, at.x + Math.cos(a) * reach));
      const y = Math.min(1 - edge, Math.max(edge + 0.02, at.y + Math.sin(a) * reach * 0.7));
      let gap = 1;
      for (const t of taken) gap = Math.min(gap, Math.hypot(t.x - x, t.y - y));
      if (gap > bestGap) {
        bestGap = gap;
        best = { x, y };
      }
    }
    return best;
  }

  draw(sk, p, now) {
    const W = sk.width, H = sk.height;
    const total = this.things.length;
    for (const thing of this.things) {
      const q = thing.q;
      const age = (now - thing.born) / 1000;
      // 피어나는 시간. 빠르게 춘 답은 빨리 피어난다
      const grows = Math.max(0.15, p.growSeconds * (1.4 - q.tempo * 0.9));
      const u = Math.min(1, age / grows);
      const grow = 1 - Math.pow(1 - u, 3);
      // 흔들림. 날카롭게 춘 답은 크게 떨었다가 금방 멈추고, 부드러운 답은 오래 천천히 흔들린다
      const wobble = Math.exp(-age * (1 + q.sharp * 2.2)) *
                     Math.sin(age * (5 + q.tempo * 10) + thing.seed) * (0.04 + q.sharp * 0.12);
      // 먼저 나온 것은 조금 물러난다
      const depth = 1 - ((total - 1 - thing.index) / Math.max(1, total)) * 0.35;
      const big = 0.6 + q.size * 0.7;
      const size = Math.min(W, H) * 0.22 * p.artScale * big * depth * (grow + wobble);
      const x = thing.x * W, y = thing.y * H;

      const img = this.art.drawing(thing.index);
      sk.push();
      sk.translate(x, y);
      // 한쪽으로만 춘 답은 기울어진 채로 선다
      sk.rotate(Math.sin(thing.seed) * 0.12 + wobble + (1 - q.symmetry) * 0.5 * Math.sign(Math.sin(thing.seed)));
      // 위아래로 춘 답은 세로로, 옆으로 춘 답은 가로로 늘어난다
      sk.scale(1 + (0.5 - q.vertical) * 0.5, 1 + (q.vertical - 0.5) * 0.5);
      if (img) {
        sk.imageMode(sk.CENTER);
        sk.tint(255, 190 + 65 * depth);
        const ratio = img.height / Math.max(1, img.width);
        sk.image(img, 0, 0, size, size * ratio);
      } else {
        this.placeholder(sk, size, thing, depth);
      }
      sk.pop();
    }
  }

  /* 작가의 그림이 아직 없을 때 쓰는 도형. 씨앗 숫자로 모양이 갈린다 */
  placeholder(sk, size, thing, depth) {
    // 날카롭게 춘 답은 각진 도형, 부드럽게 춘 답은 둥근 도형이 된다
    const odd = Math.floor(thing.seed) % 2;
    const kind = thing.q.sharp > 0.55 ? (odd ? 1 : 3) : (odd ? 0 : 2);
    const hue = (thing.index * 47 + thing.q.tempo * 120) % 360;
    sk.noStroke();
    sk.colorMode(sk.HSB, 360, 100, 100, 255);
    sk.fill(hue, 45, 95, 150 + 80 * depth);
    if (kind === 0) {
      sk.ellipse(0, 0, size, size);
    } else if (kind === 1) {
      sk.beginShape();
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const r = size * (0.35 + 0.2 * Math.sin(i * 2 + thing.seed));
        sk.vertex(Math.cos(a) * r, Math.sin(a) * r);
      }
      sk.endShape(sk.CLOSE);
    } else if (kind === 2) {
      sk.rect(-size * 0.3, -size * 0.3, size * 0.6, size * 0.6, size * 0.12);
    } else {
      sk.noFill();
      sk.stroke(hue, 45, 95, 200);
      sk.strokeWeight(size * 0.08);
      sk.arc(0, 0, size, size, 0.4, Math.PI * 1.4);
    }
    sk.colorMode(sk.RGB, 255);
  }
}
