# Third-Party Software Notices and Information

본 문서는 **DTVS (3차원 디지털 연합트윈 서비스 표출 기술)** 제품에 포함(vendored)된
오픈소스 서드파티 구성요소의 저작권 및 라이선스 고지를 제공합니다.

- 작성/검증일: 2026-10-22
- 검증 도구: ScanCode Toolkit 32.5.0 + 소스 라이선스 헤더 직접 확인
- 본 제품 자체 라이선스: GNU LGPL v2.1 (`/LICENSE`)
- 검증 상세 보고서: `OSS-LICENSE-REPORT.md`

> **듀얼 라이선스 선택 고지 (JSZip):** JSZip은 "MIT 또는 GPLv3" 듀얼 라이선스로 배포됩니다.
> 본 제품은 그 중 **MIT License를 선택(elect)하여** 사용합니다. GPLv3 조건은 적용하지 않습니다.

---

## 1. 구성요소별 고지 (Attribution)

| # | 구성요소 | 버전 | 라이선스 | 저작권자(Copyright) | 경로 |
|---|----------|------|----------|---------------------|------|
| 1 | jQuery | 2.1.3 ~ 3.5.0 | MIT | Copyright JS Foundation and other contributors | `ThirdParty/jquery/jquery-*.js` |
| 2 | jQuery MiniColors | 2.x | MIT | Copyright Cory LaViska for A Beautiful Site, LLC | `ThirdParty/jquery/jquery.minicolors.js` |
| 3 | jsTree | 3.3.8 | MIT | Copyright (c) 2014 Ivan Bozhanov | `ThirdParty/jstree/jstree.js` |
| 4 | RequireJS | 2.3.2 | MIT | Copyright jQuery Foundation and other contributors | `ThirdParty/Require/require.js` |
| 5 | three.js | r97 (min r87) | MIT | Copyright © 2010-2019 three.js authors | `ThirdParty/Three/three.js` |
| 6 | three.js examples | r97 | MIT | Copyright © three.js authors | `ThirdParty/Three/js/**` |
| 7 | three.js — FXAAShader | r97 | BSD-3-Clause | Copyright (c) NVIDIA Corporation | `ThirdParty/Three/js/shaders/FXAAShader.js` |
| 8 | three.js — FilmShader | r97 | CC-BY-3.0 | three.js authors | `ThirdParty/Three/js/shaders/FilmShader.js` |
| 9 | THREE.MeshLine | - | MIT | Copyright (c) Jaume Sanchez Elias (spite) | `ThirdParty/Three/js/THREE.MeshLine*.js` |
| 10 | Draco 3D Compression | - | Apache-2.0 | Copyright 2017 The Draco Authors (Google) | `ThirdParty/Three/js/libs/draco/**` |
| 11 | ammo.js | - | zlib | Copyright ammo.js authors (Bullet Physics port) | `ThirdParty/Three/js/libs/ammo.js` |
| 12 | dat.GUI | - | Apache-2.0 | Copyright 2011 Google Inc. (Data Arts Team) | `ThirdParty/Three/js/libs/dat.gui.min.js` |
| 13 | JSZip | - | MIT (듀얼 중 선택) | Copyright (c) 2009-2016 Stuart Knightley and contributors | `ThirdParty/Three/js/libs/jszip.min.js` |
| 14 | opentype.js | - | MIT | Copyright (c) Frederik De Bleser | `ThirdParty/Three/js/libs/opentype.min.js` |
| 15 | stats.js | r16 | MIT | Copyright (c) 2009-2016 Mr.doob | `ThirdParty/Three/js/libs/stats.min.js` |
| 16 | tween.js | r7 | MIT | Copyright (c) 2010-2012 Tween.js authors (sole) | `ThirdParty/Three/js/libs/tween.min.js` |
| 17 | system.js | - | MIT | Copyright (c) Mr.doob | `ThirdParty/Three/js/libs/system.min.js` |
| 18 | mmd-parser | - | MIT | Copyright (c) Takahiro | `ThirdParty/Three/js/libs/mmdparser.min.js` |
| 19 | timeliner | - | MIT | Copyright (c) Joshua Koo (zz85) | `ThirdParty/Three/js/libs/timeliner_gui.min.js` |
| 20 | zlib.js (inflate) | 2012 | zlib AND MIT | Copyright (c) 2012 imaya | `ThirdParty/Three/js/libs/inflate.min.js` |
| 21 | zlib.js (gunzip) | 2012 | zlib AND MIT | Copyright (c) 2012 imaya | `ThirdParty/Three/js/libs/gunzip.min.js` |
| 22 | o3dgc | - | MIT | Copyright (c) 2013 Khaled Mammou — Advanced Micro Devices, Inc. | `ThirdParty/Three/js/libs/o3dgc.js` |

경로 접두사: `src/VIZWeb3D/VIZWeb3D/ThirdParty/`

---

## 2. 라이선스 전문

### 2.1 The MIT License (MIT)

적용 구성요소: jQuery, jQuery MiniColors, jsTree, RequireJS, three.js(core 및 examples),
THREE.MeshLine, JSZip(선택), opentype.js, stats.js, tween.js, system.js, mmd-parser,
timeliner, o3dgc, 그리고 zlib.js의 MIT 부분.

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

### 2.2 Apache License, Version 2.0

적용 구성요소: Draco 3D Compression (Google), dat.GUI (Google Data Arts).

전문: http://www.apache.org/licenses/LICENSE-2.0 (전체 텍스트)

주요 의무사항:
- 저작권·특허·상표·귀속(attribution) 고지 보존 (§4-a, §4-b)
- 배포물에 `NOTICE` 파일이 포함된 경우 그 내용을 재배포물에 포함 (§4-d)
- 수정 파일에 변경 사실 명시 (§4-b)
- 특허 라이선스 부여 및 특허 소송 시 종료 조항 (§3)

> ✔ **조치 완료:** Draco/dat.GUI upstream에는 원 `NOTICE` 파일이 존재하지 않음을 확인(§4-d 재현 대상 없음).
> §4(a)/(b) 이행을 위해 본 저장소 루트에 `NOTICE.txt`(저작권 귀속 고지)와 `LICENSES/Apache-2.0.txt`(라이선스 전문)를 동봉함.

### 2.3 BSD 3-Clause "New" or "Revised" License

적용 구성요소: three.js — FXAAShader.js (NVIDIA).

```
Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice,
   this list of conditions and the following disclaimer.
2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.
3. Neither the name of the copyright holder nor the names of its contributors
   may be used to endorse or promote products derived from this software
   without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES ... (standard BSD-3 disclaimer)
```

### 2.4 zlib License

적용 구성요소: ammo.js, 그리고 zlib.js(inflate/gunzip)의 zlib 부분.

```
This software is provided 'as-is', without any express or implied warranty.
In no event will the authors be held liable for any damages arising from the
use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it freely,
subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not claim
   that you wrote the original software. If you use this software in a product,
   an acknowledgment in the product documentation is appreciated but not required.
2. Altered source versions must be plainly marked as such, and must not be
   misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
```

### 2.5 Creative Commons Attribution 3.0 (CC-BY-3.0)

적용 구성요소: three.js — FilmShader.js.

- 전문: https://creativecommons.org/licenses/by/3.0/legalcode
- 주요 의무: 원저작자 표시(attribution) 유지.
> 방침 결정: FilmShader/FilmPass는 DTVS 실행 경로에서 사용되지 않는(미참조) 번들 파일이나,
> 원본 번들 보존 방침에 따라 **파일을 유지하고 본 고지로 CC-BY-3.0 귀속 의무를 충족**한다.
> (저작자 표시가 본 문서 및 소스 파일 헤더에 유지되므로 준수 완료.)

---

## 3. 미해결/조치 권장 사항

1. **JSZip MIT 선택** — 본 문서 상단에 명시 완료. ✔
2. **Apache-2.0 귀속 고지** — `NOTICE.txt` + `LICENSES/Apache-2.0.txt` 동봉 완료. (upstream NOTICE 없음 확인) ✔
3. **THREE.MeshLine 라이선스 헤더 복원** — `.module.js` 및 `shaders/THREE.MeshLine.js`에 MIT 고지 복원. ✔
4. **FilmShader(CC-BY-3.0)** — 유지 + 귀속 고지로 준수(미사용 번들, 원본 보존 방침). ✔
5. **jQuery 구버전 정리** — 라이선스 무관(전부 MIT)하나 보안상 최신 버전 통합 권장. (권장)

---

*본 고지는 MIT·BSD·Apache-2.0·zlib·CC-BY 각 라이선스의 "저작권 및 라이선스 고지 보존" 의무를
충족하기 위해 작성되었습니다. 추가 구성요소 도입 시 본 문서를 갱신하십시오.*
