/*
 대화. **이 파일이 작가가 고칠 첫 번째 자리다.** (두 번째는 scene.js)

 누가 언제 춤출 차례인지를 정한다. 이 작품은 서로 주고받는 것이 뜻이라, 이 순서가 작품의
 성격을 정한다.

   기다림   아무도 없다. 외계인은 가만히 서서 바라본다
   인사     사람이 오면 짧게 인사한다
   말걸기   외계인이 춤춘다. 주고받을수록 조금씩 길어진다
   듣기     관객의 차례. 한 박자 쉬고 나서 답을 기다린다
   답       관객이 움직였다. 그림 한 장과 소리 한 겹이 더해진다
   가득     여러 번 주고받아 한 세계가 다 찼다

 내보내는 것
   phase    지금 단계
   turn     몇 번째 주고받음인가
   added    이번 프레임에 더해진 그림 수 (0 이면 없음)
   at       그 그림이 피어날 자리 {x, y}
   quality  마지막으로 읽은 관객의 춤의 성격 (quality.js)
   motif    외계인이 지금 추고 있는 몸짓 (phrase.js)

 바꿔 볼 것
   답으로 받아들이는 조건. 지금은 움직임의 양만 본다. 두 손을 벌렸을 때만 받아 주거나,
   외계인이 춘 방향과 같은 쪽으로 움직였을 때만 받아 주는 식으로 바꿀 수 있다
   답을 읽는 자리. read() 가 quality.js 의 여섯 가지를 돌려주고, 그것을 다음 문장이 물려받는다
   기다리는 시간. 길면 관객이 생각할 틈이 생기고, 짧으면 외계인이 자꾸 말을 건다
   주고받는 횟수. MAX_TURNS 에 닿으면 한 세계가 다 찬 것으로 본다
*/

import { MAX_TURNS, GREET_SECONDS, GONE_SECONDS, BREATH_SECONDS } from "./settings.js";
import { Phrase } from "./phrase.js";

// 아직 아무도 답하지 않았을 때 외계인이 쓰는 성격. 보통 빠르기, 보통 크기다
const DEFAULT_Q = { amount: 0.4, tempo: 0.4, size: 0.45, sharp: 0.4, vertical: 0.5, symmetry: 0.8, open: 0.4 };

export class Turn {
  constructor() {
    this.phrase = new Phrase();
    this.quality = null;     // 마지막으로 읽은 관객의 춤
    this.phase = "idle";
    this.t = 0;          // 지금 단계에 들어온 뒤 흐른 시간
    this.turn = 0;       // 몇 번 주고받았나
    this.answering = 0;  // 답이 이어진 시간
    this.gone = 0;       // 사람이 안 보인 시간
    this.added = 0;
    this.at = { x: 0.5, y: 0.5 };
  }

  go(phase) {
    this.phase = phase;
    this.t = 0;
  }

  /* 말을 걸기 전에 문장을 짓는다. 관객의 답을 물려받는 자리다 */
  compose(p) {
    this.phrase.make(this.quality || DEFAULT_Q, this.turn, p);
  }

  /* dt 는 지난 시간(초), m 은 quality.js 가 준 프레임 숫자, read 는 한 번의 답을 읽는 함수 */
  step(dt, frame, m, p, read) {
    this.t += dt;
    this.added = 0;
    this.gone = frame.present ? 0 : this.gone + dt;

    // 사람이 오래 자리를 뜨면 처음으로 돌아간다. 다음 사람이 빈 화면에서 시작하게 한다
    if (this.gone > p.resetSeconds) {
      this.turn = 0;
      this.answering = 0;
      if (this.phase !== "idle") this.go("idle");
      return this.out(true);
    }
    const here = frame.present && this.gone < GONE_SECONDS;

    switch (this.phase) {
      case "idle":
        if (here && this.t > GREET_SECONDS) this.go("greet");
        break;
      case "greet":
        if (this.t > 1.2) {
          this.compose(p);
          this.go("call");
        }
        break;
      case "call":
        // 문장을 다 추면 관객의 차례다. 문장의 길이는 phrase.js 가 정한다
        if (this.t > this.phrase.total) this.go("wait");
        break;
      case "wait":
        // 말이 끝나자마자 답으로 세지 않는다. 차례가 넘어온 것을 볼 틈을 준다
        if (this.t < BREATH_SECONDS) break;
        // 답. 움직임이 문턱을 넘은 채로 잠시 이어져야 한 번으로 센다
        this.answering = m.amount > p.answerAt ? this.answering + dt : Math.max(0, this.answering - dt * 2);
        if (this.answering > p.answerHold) {
          this.answering = 0;
          this.turn += 1;
          this.added = p.perAnswer;
          this.at = { x: m.x, y: m.y };
          this.quality = read();          // 방금의 춤을 읽는다. 다음 문장이 이것을 물려받는다
          this.go(this.turn >= MAX_TURNS ? "full" : "reply");
        } else if (this.t > p.waitSeconds) {
          this.compose(p);   // 답이 없으면 다시 말을 건다
          this.go("call");
        }
        break;
      case "reply":
        if (this.t > 0.8) {
          this.compose(p);
          this.go("call");
        }
        break;
      case "full":
        if (this.t > 12) {
          this.turn = 0;
          this.go("idle");
        }
        break;
    }
    return this.out(here);
  }

  out(here) {
    const calling = this.phase === "call" || this.phase === "greet";
    return {
      phase: this.phase, turn: this.turn, added: this.added, at: this.at,
      here, progress: Math.min(1, this.turn / MAX_TURNS),
      answering: this.answering, t: this.t,
      quality: this.quality,
      motif: calling ? this.phrase.at(this.t) : null,
      phrase: this.phrase,
    };
  }
}
