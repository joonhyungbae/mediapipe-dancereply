# mediapipe-dancereply

**화면 속 낯선 존재가 짧은 춤으로 먼저 말을 겁니다.** 관객이 자기 방식으로 몸을 움직여 답하면
빈 화면에 그림이 한 장 피어나고 소리가 한 겹 더해집니다. 주고받을수록 그림과 음악이 쌓여
하나의 세계가 만들어집니다.

웹캠 한 대와 노트북, 브라우저로 돕니다. [MediaPipe](https://ai.google.dev/edge/mediapipe) 가 몸의
관절을 찾고, 그림은 [p5.js](https://p5js.org) 가 그리고, 소리는 브라우저가 냅니다. 작가가 그린
그림과 만든 소리를 폴더에 넣으면 그것이 쌓입니다. 완성된 작품이 아니라 출발점이고, 바꿔 가며
자기 작품으로 만들라고 둔 예제입니다.

설치 없이 보려면 <https://joonhyungbae.github.io/mediapipe-dancereply/> 를 크롬으로 엽니다.
카메라 권한을 허락하면 바로 움직임이 잡힙니다. 카메라 없이 보려면 주소 뒤에 `?sim` 을 붙입니다.

《2026 오픈서킷 부산: 아트앤테크 프랙티스》 멘토링 과정에서 만든 예제입니다. 참여 작가와
작업을 구상하다 공통으로 쓸 만한 뼈대가 나와, 참여자 누구나 쓸 수 있도록 공개합니다.

## 1. 깔기

터미널을 엽니다. 윈도우는 시작 메뉴에서 `PowerShell`, 맥은 `터미널`입니다.

**맥 · 리눅스**

```bash
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/mediapipe-dancereply/main/install.sh | bash
```

**윈도우 (PowerShell)**

```powershell
Set-ExecutionPolicy -Scope Process Bypass -Force
irm https://raw.githubusercontent.com/joonhyungbae/mediapipe-dancereply/main/install.ps1 -OutFile "$env:TEMP\install.ps1"
& "$env:TEMP\install.ps1"
```

설치가 챙기는 것: conda 환경(`dancereply`)과 사람을 찾는 모델(약 6MB).
conda 가 없으면 [Miniforge](https://conda-forge.org/download/)를 사용자 폴더에 먼저 깝니다.

## 2. 켜기

```bash
./start.sh          # 맥 · 리눅스
.\start.ps1         # 윈도우
```

브라우저가 저절로 열립니다. 안 열리면 `127.0.0.1:7000` 을 칩니다. 끌 때는 <kbd>Ctrl</kbd>+<kbd>C</kbd>.

| 명령 | 하는 일 |
|---|---|
| `./start.sh` | 카메라로 켠다 |
| `./start.sh --sim` | 카메라 없이 가짜 관객으로. 가끔 저절로 춤춘다 |
| `./start.sh --display` | 조절판 없이 화면만. 전시용이다 |
| `./start.sh --offline 20` | 20초를 녹화해 out 파일로 적고 끝낸다 |
| `./start.sh --host 0.0.0.0` | 다른 컴퓨터에서 화면을 본다 |
| `./start.sh --port 7001` | 포트를 바꾼다 |

소리는 화면 왼쪽 아래 **소리 켜기** 를 눌러야 납니다. 브라우저가 그렇게 막아 둡니다.

## 3. 내 그림과 소리 넣기

`web/art/` 에 파일을 넣고 새로 고치면 끝입니다. 목록은 켤 때마다 저절로 다시 만들어집니다.

```text
web/art/
├── 01-나무.png      그림. 배경이 비치는 PNG, 긴 쪽 800픽셀이면 넉넉하다
├── 02-새.png        이름 순서대로 쌓인다
├── alien-1.png      이름이 alien 으로 시작하면 외계인의 그림이 된다 (여러 장이면 넘겨 가며 춘다)
└── 01-바람.mp3      소리. 8~16초 루프. 답할 때마다 한 겹씩 겹친다
```

그림이 없으면 자리표시자 도형이, 소리가 없으면 맑은 음 하나가 대신 납니다. 그림의 생김새보다
대화의 흐름을 먼저 맞춰 보라고 그렇게 두었습니다. 자세한 요령은 [web/art/README.md](web/art/README.md).

## 4. 화면에서 보는 것

- **왼쪽 큰 화면**: 외계인과, 답할 때마다 피어나는 그림들
- **감지한 것**: 카메라가 본 것과 손목 자리. 움직임 · 답하는 중 · 두 손 벌림
- **대화**: 지금 누구 차례인지와 몇 번 주고받았는지. 규칙은 `web/turn.js` 입니다
- **조절**: 답으로 보는 움직임부터 그림 크기까지. 바꾼 값은 이 브라우저에 남습니다

## 5. 바꾸는 자리

1. **`web/settings.js`** — 숫자가 전부 여기 있습니다. 안내 글도 이 파일에 있습니다.
2. **`web/turn.js`** — 누가 언제 춤출 차례인지. 무엇을 답으로 받아들일지 정하는 자리입니다.
3. **`web/scene.js`** — 그림이 어디에 어떻게 피어나는지.
4. **`web/alien.js`** — 외계인이 어떻게 추는지. 작가의 그림을 넣으면 그 그림으로 춥니다.

고치고 브라우저를 새로 고치면 바로 보입니다. 빌드가 없습니다.

## 6. 어떤 춤이든 답으로 받는다

이 작품은 춤의 모양을 알아맞히지 않습니다. 정해진 동작을 맞혔는지 보지 않고 **얼마나, 어디서
움직였는지만** 봅니다. 서로 다른 몸짓을 그대로 받아들이는 것이 작품의 뜻이라, 감지도 그렇게
두었습니다.

움직임의 양은 몸 크기로 나눠 둡니다. 그러지 않으면 카메라에 가까운 사람만 크게 움직인 것이
되고, 멀리 선 사람은 아무리 춰도 답으로 받아들여지지 않습니다. 휠체어를 탄 사람이나 손만
움직이는 사람도 답할 수 있게 하려면 조절판의 「답으로 보는 움직임」을 내립니다.

## 7. 안 될 때

| 이런 일이 생기면 | 이렇게 합니다 |
|---|---|
| 카메라가 안 열린다 | 브라우저가 권한을 물었는지 봅니다. 맥은 시스템 설정에서 크롬에 카메라를 켭니다 |
| 가만히 있어도 답으로 센다 | 「답으로 보는 움직임」을 올리고 「답이 이어져야 하는 시간」을 늘립니다 |
| 크게 춰도 안 받아 준다 | 온몸이 화면에 들어오는지 보고, 「답으로 보는 움직임」을 내립니다 |
| 그림이 한자리에 겹친다 | `web/scene.js` 의 `spot()` 이 빈 자리를 고릅니다. 후보 수나 거리를 늘려 봅니다 |
| 소리가 안 난다 | 「소리 켜기」를 눌렀는지 봅니다. 브라우저는 누르기 전에는 소리를 내지 않습니다 |
| 그림을 넣었는데 안 나온다 | `python3 make_art.py` 를 한 번 돌리고 새로 고칩니다. 파일 이름에 공백이 있어도 됩니다 |
| 느리다 | 주소 뒤에 `?in=256` 을 붙입니다 |

## 8. 더 들어가기

```text
serve.py            web/ 를 띄우고, --offline 녹화를 받아 파일로 적는다
fetch_model.py      사람을 찾는 모델을 받는다
make_art.py         web/art/ 의 그림과 소리 목록을 만든다
web/
├── settings.js     만지는 숫자와 안내 글
├── sense.js        카메라에서 관절을 찾는다 (MediaPipe)
├── motion.js       관절에서 움직임의 양과 자리를 뽑는다
├── turn.js         누가 언제 춤출 차례인지 (대화의 규칙)
├── art.js          작가의 그림과 소리를 불러온다
├── alien.js        외계인이 춘다
├── scene.js        답할 때마다 그림이 피어나 쌓인다
├── sound.js        답할 때마다 소리가 한 겹씩 쌓인다
└── app.js          위의 것들을 한 프레임마다 잇는다
```

카메라 영상은 이 브라우저 안에서만 돕니다. 서버로도 파일로도 보내지 않습니다.
왜 이렇게 만들었는지는 [docs/notes.md](docs/notes.md). AI 도구로 고칠 때의 규칙은 [AGENTS.md](AGENTS.md).

## 쓰는 것과 라이선스

[p5.js](https://p5js.org) (LGPL-2.1) 와 [MediaPipe](https://ai.google.dev/edge/mediapipe) (Apache-2.0)
를 씁니다. 라이브러리는 저장소에 들어 있고 모델은 설치할 때 받습니다. 전체 목록은 [NOTICE.md](NOTICE.md).

코드는 [OpenCircuit License v1.0](LICENSE)을 따릅니다. 오픈소스가 아니라 소스를 공개하되
쓰임을 제한합니다.

- **됩니다**: 받아서 쓰고 고치기. 이것으로 만든 **작품**은 전시하고 팔아도 허가가 필요 없습니다.
- **문의해 주세요**: 강좌나 워크숍의 교재로 쓰는 것, 코드 자체를 파는 것. <jh.bae@kaist.ac.kr>

---

<details>
<summary>English</summary>

A stranger on screen dances a short phrase and waits. When you answer with your own movement,
one drawing blooms on the empty screen and one sound layer joins. Turn by turn, the drawings and
the music pile up into a world.

```bash
curl -fsSL https://raw.githubusercontent.com/joonhyungbae/mediapipe-dancereply/main/install.sh | bash
cd mediapipe-dancereply && ./start.sh --sim
```

MediaPipe finds the joints, p5.js draws, the browser makes the sound. It does not classify the
dance: it only measures how much and where you moved, normalized by body size, so any movement
counts as an answer. Drop your own PNGs and loops into `web/art/` and they are what accumulates.
Two files are yours to rewrite: `web/turn.js` (who speaks when) and `web/scene.js` (where the
drawings bloom). The camera image never leaves the browser.

Source-available, not open source: personal and artistic use is free and the works you make are
entirely yours; teaching with it or selling it needs permission ([LICENSE](LICENSE)).

</details>

<sub>《2026 오픈서킷 부산: 아트앤테크 프랙티스》에서 만든 작품 베이스라인입니다. 다른 도구는
[opencircuit](https://github.com/joonhyungbae/opencircuit)에 모여 있습니다.</sub>
