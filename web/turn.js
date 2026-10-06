/*
 대화. **이 파일이 작가가 고칠 첫 번째 자리다.** (두 번째는 scene.js)

 누가 언제 춤출 차례인지를 정한다. 이 작품은 서로 주고받는 것이 뜻이라, 이 순서가 작품의
 성격을 정한다.

   기다림   아무도 없다. 외계인은 가만히 서서 바라본다
   인사     사람이 오면 짧게 인사한다
   말걸기   외계인이 춤춘다. 주고받을수록 조금씩 길어진다
   듣기     관객의 차례. 답을 기다린다
   답       관객이 움직였다. 그림 한 장과 소리 한 겹이 더해진다
   가득     여러 번 주고받아 한 세계가 다 찼다

 내보내는 것
   phase    지금 단계
   turn     몇 번째 주고받음인가
   added    이번 프레임에 더해진 그림 수 (0 이면 없음)
   at       그 그림이 피어날 자리 {x, y}

 바꿔 볼 것
   답으로 받아들이는 조건. 지금은 움직임의 양만 본다. 두 손을 벌렸을 때만 받아 주거나,
   외계인이 춘 방향과 같은 쪽으로 움직였을 때만 받아 주는 식으로 바꿀 수 있다
   기다리는 시간. 길면 관객이 생각할 틈이 생기고, 짧으면 외계인이 자꾸 말을 건다
   주고받는 횟수. MAX_TURNS 에 닿으면 한 세계가 다 찬 것으로 본다
*/

import { MAX_TURNS, GREET_SECONDS, GONE_SECONDS } from "./settings.js";

const NEXT = { idle: "greet", greet: "call", call: "wait", wait: "call", reply: "call" };

export class Turn {
  constructor() {
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

  /* dt 는 지난 시간(초), m 은 motion.js 가 준 숫자, p 는 조절판 */
  step(dt, frame, m, p) {
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
        if (this.t > 1.2) this.go("call");
        break;
      case "call":
        // 주고받을수록 외계인의 말이 조금씩 길어진다
        if (this.t > p.callSeconds * (1 + this.turn * 0.12)) this.go("wait");
        break;
      case "wait":
        // 답. 움직임이 문턱을 넘은 채로 잠시 이어져야 한 번으로 센다
        this.answering = m.amount > p.answerAt ? this.answering + dt : Math.max(0, this.answering - dt * 2);
        if (this.answering > p.answerHold) {
          this.answering = 0;
          this.turn += 1;
          this.added = p.perAnswer;
          this.at = { x: m.x, y: m.y };
          this.go(this.turn >= MAX_TURNS ? "full" : "reply");
        } else if (this.t > p.waitSeconds) {
          this.go("call");   // 답이 없으면 다시 말을 건다
        }
        break;
      case "reply":
        if (this.t > 0.8) this.go("call");
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
    return {
      phase: this.phase, turn: this.turn, added: this.added, at: this.at,
      here, progress: Math.min(1, this.turn / MAX_TURNS),
      answering: this.answering,
    };
  }
}
