/*
 소리. 답할 때마다 한 겹씩 쌓인다.

 작가가 만든 루프를 겹쳐 쌓는다. 겹마다 그 답의 성격이 입혀진다. 날카롭게 춘 답은 밝게,
 느리게 춘 답은 둥글고 낮게 들린다. 같은 루프라도 누가 어떻게 췄는지에 따라 다르게 쌓인다. 겹이 늘수록 음악이 풍성해지고, 처음으로 돌아가면 모두
 내려간다. 모든 겹은 끊지 않고 계속 돌고, 새로 쌓일 때 소리만 서서히 올린다. 그래야 겹끼리
 박자가 어긋나지 않는다.

 작가의 소리가 아직 없으면 맑은 음 하나를 대신 낸다. 음은 5음 음계에서 고른다. 아무렇게나
 겹쳐도 부딪히지 않는 음계라, 몇 겹이 쌓여도 듣기 괴롭지 않다.

 브라우저는 사람이 누르기 전에는 소리를 내지 않는다. 화면의 단추에서 시작한다.
*/

const SCALE = [0, 2, 4, 7, 9];     // 5음 음계(펜타토닉)의 반음 간격
const BASE = 261.63;               // 가온 다

export class Sound {
  constructor(art) {
    this.art = art;
    this.on = false;
    this.layers = [];     // {gain, node}
  }

  async start() {
    if (this.on) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    await this.ctx.resume();
    this.out = this.ctx.createGain();
    this.out.gain.value = 0.9;
    this.out.connect(this.ctx.destination);
    this.on = true;
  }

  stop() {
    this.layers.forEach((l) => l.stop());
    this.layers = [];
    this.ctx?.close();
    this.on = false;
  }

  /* n 번째 겹을 쌓는다. 작가의 소리가 있으면 그것을, 없으면 음 하나를 낸다.
     q 는 그 답의 성격이다. 빠르게 춘 답은 높고 또렷하게, 느린 답은 낮고 둥글게 들린다 */
  add(n, q) {
    if (!this.on) return;
    const url = this.art.sound(n);
    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.out);
    gain.gain.linearRampToValueAtTime(url ? 0.7 : 0.14, this.ctx.currentTime + 1.5);

    // 밝기. 날카롭게 춘 답일수록 높은 소리까지 지나간다
    const tone = this.ctx.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.value = 500 + (q ? q.sharp * 0.6 + q.tempo * 0.4 : 0.4) * 5500;
    tone.Q.value = 0.7;
    tone.connect(gain);

    if (url) {
      const el = new Audio(url);
      el.loop = true;
      el.crossOrigin = "anonymous";
      // 느리게 춘 답은 조금 느리게 돈다. 많이 바꾸면 음이 어긋나므로 좁게 둔다
      el.playbackRate = q ? 0.92 + q.tempo * 0.16 : 1;
      const src = this.ctx.createMediaElementSource(el);
      src.connect(tone);
      el.play().catch(() => {});
      this.layers.push({ stop: () => { el.pause(); tone.disconnect(); gain.disconnect(); } });
      return;
    }

    // 자리표시자 음. 겹이 쌓일수록 한 옥타브 안에서 위로 올라간다.
    // 빠르게 춘 답은 한 옥타브 위에서, 크게 춘 답은 한 음 아래에서 난다
    const lift = q && q.tempo > 0.6 ? 12 : 0;
    const drop = q && q.size > 0.6 ? -5 : 0;
    const step = SCALE[n % SCALE.length] + 12 * Math.floor(n / SCALE.length) + lift + drop;
    const osc = this.ctx.createOscillator();
    osc.type = q && q.sharp > 0.55 ? "sawtooth" : "triangle";
    osc.frequency.value = BASE * Math.pow(2, step / 12);
    const lfo = this.ctx.createOscillator();     // 소리가 고정되어 있으면 기계처럼 들린다
    const depth = this.ctx.createGain();
    lfo.frequency.value = 0.18 + n * 0.03;
    depth.gain.value = 0.045;
    lfo.connect(depth).connect(gain.gain);
    osc.connect(tone);
    osc.start();
    lfo.start();
    this.layers.push({ stop: () => { osc.stop(); lfo.stop(); tone.disconnect(); gain.disconnect(); } });
  }

  /* 처음으로 돌아갈 때. 겹을 모두 내린다 */
  clear() {
    if (!this.on) return;
    for (const layer of this.layers) setTimeout(layer.stop, 1600);
    this.layers = [];
  }

  get count() {
    return this.layers.length;
  }
}
