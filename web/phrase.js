/*
 외계인의 춤 한 마디. **이 파일도 작가가 고칠 자리다.**

 외계인은 아무렇게나 흔들지 않는다. 몸짓 몇 개를 이어 한 「문장」을 춘다. 관객이 답하면
 그 답의 성격을 물려받아 다음 문장을 짓는다. 빠르게 답한 사람에게는 빠르게, 크게 답한
 사람에게는 크게 말한다. 그래야 주고받는 것이 대화로 보인다.

 몸짓은 다섯이다.
   sway   좌우로 흔든다
   hop    위아래로 뛴다
   open   팔을 펼쳤다 모은다
   spin   한 바퀴 돈다
   hold   멈춘다. 쉼표다

 만들어 내보내는 것
   motifs   [{kind, seconds, speed, size}]
   total    문장 전체의 길이(초)
   at(t)    그 시각의 몸짓과 그 안에서의 진행 0~1

 바꿔 볼 것
   몸짓의 종류를 늘린다. 손을 흔드는 것, 몸을 숙이는 것, 멀어졌다 다가오는 것
   물려받는 정도(조절판의 「따라 하는 정도」). 0 이면 관객과 무관하게 추고, 1 이면 거의 흉내 낸다
   문장이 길어지는 방식. 지금은 주고받을수록 한 몸짓씩 늘어난다
*/

const KINDS = ["sway", "hop", "open", "spin", "hold"];

export class Phrase {
  constructor() {
    this.motifs = [{ kind: "sway", seconds: 2, speed: 0.4, size: 0.4 }];
    this.total = 2;
  }

  /* 관객의 성격 q 를 물려받아 문장을 짓는다. turn 이 늘수록 길어진다 */
  make(q, turn, p) {
    const echo = p.echo;
    const mix = (mine, theirs) => mine * (1 - echo) + theirs * echo;
    const speed = mix(0.45, q.tempo);
    const size = mix(0.45, q.size);

    // 몸짓 고르기. 관객이 위아래로 췄으면 뛰는 몸짓이, 옆으로 췄으면 흔드는 몸짓이 잘 나온다
    const weights = {
      sway: 1 + (1 - q.vertical) * 1.5,
      hop: 0.6 + q.vertical * 1.8,
      open: 0.6 + q.open * 1.6,
      spin: 0.3 + q.size * 1.2,
      hold: 0.5 + (1 - q.tempo) * 1.2,
    };
    const pick = () => {
      let total = 0;
      for (const k of KINDS) total += weights[k];
      let r = Math.random() * total;
      for (const k of KINDS) {
        r -= weights[k];
        if (r <= 0) return k;
      }
      return "sway";
    };

    const count = Math.min(5, 2 + Math.floor(turn / 3));
    const unit = p.callSeconds / 2;
    const motifs = [];
    let last = "";
    for (let i = 0; i < count; i++) {
      let kind = pick();
      if (kind === last && kind === "hold") kind = "sway";   // 쉼표가 연달아 오지 않게
      last = kind;
      // 빠른 답을 받으면 몸짓 하나가 짧아진다. 문장 전체의 호흡이 빨라진다
      const seconds = unit * (kind === "hold" ? 0.5 : 1) * (1.4 - speed * 0.7) * (0.8 + Math.random() * 0.4);
      motifs.push({
        kind,
        seconds,
        speed: Math.min(1, speed * (0.85 + Math.random() * 0.3)),
        size: Math.min(1, size * (0.85 + Math.random() * 0.3)),
      });
    }
    this.motifs = motifs;
    this.total = motifs.reduce((a, m) => a + m.seconds, 0);
    return this;
  }

  /* 지금 어떤 몸짓을 추고 있나 */
  at(t) {
    let left = t;
    for (const m of this.motifs) {
      if (left < m.seconds) {
        return { ...m, u: left / m.seconds, done: false };
      }
      left -= m.seconds;
    }
    const last = this.motifs[this.motifs.length - 1];
    return { ...last, u: 1, done: true };
  }

  /* 화면과 조절판에 띄울 문장. 몸짓을 사람의 말로 적는다 */
  words() {
    const name = { sway: "흔들기", hop: "뛰기", open: "펼치기", spin: "돌기", hold: "쉼" };
    return this.motifs.map((m) => name[m.kind]).join(" · ");
  }
}
