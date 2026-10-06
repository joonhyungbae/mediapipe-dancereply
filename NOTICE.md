# 제3자 구성요소

| 쓰는 것 | 어디 것 | 라이선스 | 어디에 |
|---|---|---|---|
| [p5.js](https://p5js.org) | Processing Foundation | LGPL-2.1 | `web/vendor/p5/` |
| [MediaPipe Tasks Vision](https://ai.google.dev/edge/mediapipe) | Google | Apache-2.0 | `web/vendor/mediapipe/` |
| [Pose Landmarker 모델](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker) | Google | Apache-2.0 | 설치할 때 `web/models/` 로 받는다 |
| Web Audio API · Canvas | 브라우저 표준 | 브라우저에 포함 | |
| Python 표준 라이브러리 (`http.server`) | Python | PSF | |

p5.js 는 LGPL-2.1 이라 고치지 않고 그대로 넣었습니다.

작가가 `web/art/` 에 넣는 그림과 소리는 그 작가의 것입니다. 저장소에 올라가지 않습니다.
화면에 쓰는 글꼴은 쓰는 사람의 기계에 있는 것(system-ui)입니다. 내려받는 글꼴이 없습니다.
