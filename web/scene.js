/*
 세계. **이 파일이 작가가 고칠 두 번째 자리다.** (첫 번째는 turn.js)

 답할 때마다 그림이 한 장씩 피어나 쌓인다. 어디에 어떻게 피어나는지가 이 파일이다.

 지금의 규칙
   관객이 움직인 쪽에서 피어나되, 이미 그림이 있는 자리와 외계인이 선 자리는 피한다
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
  add(count, at, now) {
    for (let i = 0; i < count; i++) {
      const spot = this.spot(at);
      this.things.push({
        x: spot.x, y: spot.y, born: now,
        seed: Math.random() * 10, index: this.things.length,
      });
    }
  }

  /* 후보를 몇 군데 뽑아 가장 빈 자리를 고른다 */
  spot(at) {
    const taken = [...this.things, { x: 0.5, y: 0.52 }];   // 마지막은 외계인이 선 자리
    let best = null, bestGap = -1;
    for (let i = 0; i < 12; i++) {
      // 처음에는 움직인 자리 가까이에서, 뒤로 갈수록 멀리까지 넓혀 본다
      const reach = 0.12 + (i / 11) * 0.55;
      const a = Math.random() * Math.PI * 2;
      const x = Math.min(0.9, Math.max(0.1, at.x + Math.cos(a) * reach));
      const y = Math.min(0.88, Math.max(0.14, at.y + Math.sin(a) * reach * 0.7));
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
      const age = (now - thing.born) / 1000;
      // 피어나기. 작게 시작해 제 크기로 커지고, 한 번 흔들린 뒤 멈춘다
      const u = Math.min(1, age / Math.max(0.1, p.growSeconds));
      const grow = 1 - Math.pow(1 - u, 3);
      const wobble = Math.exp(-age * 1.6) * Math.sin(age * 9 + thing.seed) * 0.08;
      // 먼저 나온 것은 조금 물러난다
      const depth = 1 - ((total - 1 - thing.index) / Math.max(1, total)) * 0.35;
      const size = Math.min(W, H) * 0.22 * p.artScale * depth * (grow + wobble);
      const x = thing.x * W, y = thing.y * H;

      const img = this.art.drawing(thing.index);
      sk.push();
      sk.translate(x, y);
      sk.rotate(Math.sin(thing.seed) * 0.12 + wobble);
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
    const kind = Math.floor(thing.seed) % 4;
    const hue = (thing.index * 47) % 360;
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
