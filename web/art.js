/*
 자료. 작가가 그린 그림과 만든 소리를 불러온다.

 web/art/ 에 파일을 넣고 `python3 make_art.py` 를 한 번 돌리면 목록(art/art.json)이 만들어진다.
 ./start.sh 가 켤 때마다 그 목록을 다시 만들므로, 파일을 넣고 새로 고치기만 하면 된다.

 아직 그림이 없어도 작품은 돈다. 자리표시자 도형이 대신 나온다. 그림의 생김새가 아니라
 대화의 흐름을 먼저 맞춰 보라고 둔 것이다.

 그림을 만들 때
   배경이 비치는 PNG 로 저장한다. 한 장에 하나씩, 긴 쪽 800픽셀이면 넉넉하다
   화면에 쌓이는 순서는 파일 이름 순서다. 01-나무.png, 02-새.png 처럼 앞에 번호를 붙인다

 소리를 만들 때
   8초에서 16초 사이의 루프로 만든다. 답할 때마다 한 겹씩 겹쳐 쌓이므로 서로 부딪히지 않게
   음이 적은 것이 낫다. 파일 이름 순서대로 쌓인다
*/

import { ART_LIST } from "./settings.js";

export class Art {
  constructor() {
    this.drawings = [];     // {img, name}
    this.aliens = [];       // 외계인 그림. 이름이 alien 으로 시작하는 것
    this.sounds = [];       // {url, name}
    this.note = "";
  }

  async load(p5sketch) {
    let list = { drawings: [], sounds: [] };
    try {
      const res = await fetch(ART_LIST, { cache: "no-store" });
      if (res.ok) list = await res.json();
    } catch {
      // 목록이 없으면 자리표시자로 간다. 처음 켤 때는 이것이 보통이다
    }

    const load = (names) =>
      Promise.all(
        names.map(
        (name) =>
          (name) =>
            new Promise((ok) =>
              p5sketch.loadImage(
                `art/${name}`,
                (img) => ok({ img, name }),
                () => ok(null)
              )
            )
        )
      ).then((all) => all.filter(Boolean));

    this.drawings = await load(list.drawings || []);
    this.aliens = await load(list.aliens || []);

    this.sounds = (list.sounds || []).map((name) => ({ url: `art/${name}`, name }));
    this.note = this.drawings.length || this.aliens.length
      ? `그림 ${this.drawings.length}장 · 외계인 ${this.aliens.length}장 · 소리 ${this.sounds.length}개`
      : "작가의 그림이 아직 없어 자리표시자로 그립니다 (web/art/ 에 넣고 새로 고침)";
    return this;
  }

  /* n 번째 답에 쓸 그림. 그림이 모자라면 처음부터 다시 쓴다 */
  drawing(n) {
    if (!this.drawings.length) return null;
    return this.drawings[n % this.drawings.length].img;
  }

  /* 외계인 그림을 순서대로 넘긴다. 춤이 빠를수록 빨리 넘어간다 */
  alien(phase) {
    if (!this.aliens.length) return null;
    return this.aliens[Math.floor(Math.abs(phase)) % this.aliens.length].img;
  }

  sound(n) {
    if (!this.sounds.length) return null;
    return this.sounds[n % this.sounds.length].url;
  }
}
