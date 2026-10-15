# 제3자 소프트웨어 고지 (Third-Party Notices)

이 소프트웨어(`data-ingest`, Copyright (c) e8ight Co., Ltd.)에는 아래 제3자 오픈소스 구성요소가 포함되어 있습니다.
각 구성요소의 저작권은 해당 저작권자에게 있으며, 각 구성요소의 라이선스 조건에 따라 사용·배포됩니다.
라이선스 전문은 이 문서 하단 "라이선스 전문"에 있습니다.

build.gradle에 선언되어 배포 jar·이미지에 포함되는 의존성을 수록했습니다(테스트·컴파일 전용 제외). 전이 의존성 전체 목록은 Gradle 빌드 시 의존성 리포트로 확인할 수 있습니다.

- 작성일: 2026-10-15
- 구성요소 수: 26

## 구성요소 목록

| 구성요소 | 버전 | 라이선스 | 저작권자 | 출처 |
| --- | --- | --- | --- | --- |
| com.fasterxml.jackson.core:jackson-databind | 2.12.6.1 | Apache-2.0 | FasterXML | http://github.com/FasterXML/jackson |
| com.querydsl:querydsl-apt | 5.0.0 | Apache-2.0 | Querydsl | ${project.homepage} |
| com.querydsl:querydsl-jpa | 5.0.0 | Apache-2.0 | Querydsl | ${project.homepage} |
| com.squareup.okhttp3:okhttp | 3.14.1 | Apache-2.0 | okhttp authors | https://github.com/square/okhttp |
| com.squareup.okhttp3:okhttp | 3.14.4 | Apache-2.0 | okhttp authors | https://github.com/square/okhttp |
| com.squareup.okio:okio | 1.17.2 | Apache-2.0 | okio authors | https://github.com/square/okio |
| com.vladmihalcea:hibernate-types-52 | 2.16.0 | Apache-2.0 | Vlad Mihalcea | https://github.com/vladmihalcea/hibernate-types |
| Gradle Wrapper (gradlew, gradle-wrapper.jar) | - | Apache-2.0 | Copyright 2015 the original author or authors (Gradle, Inc.) | https://gradle.org |
| net.logstash.logback:logstash-logback-encoder | 7.0.1 | Apache-2.0 OR MIT | Neil Prosser, Phil Clay, John E. Vincent | https://github.com/logfellow/logstash-logback-encoder |
| org.apache.commons:commons-lang3 | 3.12.0 | Apache-2.0 | The Apache Software Foundation | https://commons.apache.org/proper/commons-lang/ |
| org.apache.flume.flume-ng-sinks:flume-ng-kafka-sink | 1.10.1 | Apache-2.0 | Apache Software Foundation | https://git-wip-us.apache.org/repos/asf?p=flume.git;a=tree;h=refs/heads/trunk;hb=trunk |
| org.apache.flume:flume-ng-core | 1.10.1 | Apache-2.0 | Apache Software Foundation | https://git-wip-us.apache.org/repos/asf?p=flume.git;a=tree;h=refs/heads/trunk;hb=trunk |
| org.apache.logging.log4j:log4j-api | 2.18.0 | Apache-2.0 | The Apache Software Foundation | https://logging.apache.org/log4j/2.x/ |
| org.apache.logging.log4j:log4j-core | 2.18.0 | Apache-2.0 | The Apache Software Foundation | https://logging.apache.org/log4j/2.x/ |
| org.apache.logging.log4j:log4j-layout-template-json | 2.18.0 | Apache-2.0 | The Apache Software Foundation | https://logging.apache.org/log4j/2.x/ |
| org.codehaus.janino:janino | 3.1.7 | BSD-3-Clause | Arno Unkrig, Vy Nguyen | http://janino-compiler.github.io/janino/ |
| org.json:json | 20250517 | LicenseRef-scancode-public-domain | Douglas Crockford | https://github.com/douglascrockford/JSON-java |
| org.postgresql:postgresql | 42.3.6 | BSD-2-Clause | PostgreSQL Global Development Group | https://jdbc.postgresql.org |
| org.projectlombok:lombok | 1.18.24 | MIT | Reinier Zwitserloot, Roel Spilker | https://projectlombok.org |
| org.springdoc:springdoc-openapi-ui | 1.5.13 | Apache-2.0 | Pivotal | https://springdoc.org/ |
| org.springframework.boot:spring-boot-starter-data-jpa | 2.7.1 | Apache-2.0 | Pivotal Software, Inc. | https://spring.io/projects/spring-boot |
| org.springframework.boot:spring-boot-starter-validation | 2.7.1 | Apache-2.0 | Pivotal Software, Inc. | https://spring.io/projects/spring-boot |
| org.springframework.boot:spring-boot-starter-web | 2.7.1 | Apache-2.0 | Pivotal Software, Inc. | https://spring.io/projects/spring-boot |
| org.springframework.cloud:spring-cloud-sleuth-zipkin | 3.1.1 | Apache-2.0 | Pivotal Software, Inc. | https://github.com/spring-cloud/spring-cloud-sleuth |
| org.springframework.cloud:spring-cloud-starter-netflix-eureka-client | 3.1.4 | Apache-2.0 | Pivotal Software, Inc. | https://projects.spring.io/spring-cloud |
| org.springframework.cloud:spring-cloud-starter-sleuth | 3.1.1 | Apache-2.0 | Pivotal Software, Inc. | https://github.com/spring-cloud/spring-cloud-sleuth |

## 라이선스 전문

### Apache-2.0

적용 구성요소: Gradle Wrapper (gradlew, gradle-wrapper.jar), com.fasterxml.jackson.core:jackson-databind, com.querydsl:querydsl-apt, com.querydsl:querydsl-jpa, com.squareup.okhttp3:okhttp, com.squareup.okio:okio, com.vladmihalcea:hibernate-types-52, net.logstash.logback:logstash-logback-encoder, org.apache.commons:commons-lang3, org.apache.flume.flume-ng-sinks:flume-ng-kafka-sink, org.apache.flume:flume-ng-core, org.apache.logging.log4j:log4j-api, org.apache.logging.log4j:log4j-core, org.apache.logging.log4j:log4j-layout-template-json, org.springdoc:springdoc-openapi-ui, org.springframework.boot:spring-boot-starter-data-jpa, org.springframework.boot:spring-boot-starter-validation, org.springframework.boot:spring-boot-starter-web, org.springframework.cloud:spring-cloud-sleuth-zipkin, org.springframework.cloud:spring-cloud-starter-netflix-eureka-client, org.springframework.cloud:spring-cloud-starter-sleuth

```text
Apache License
Version 2.0, January 2004
http://www.apache.org/licenses/

TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

1. Definitions.

"License" shall mean the terms and conditions for use, reproduction, and distribution as defined by Sections 1 through 9 of this document.

"Licensor" shall mean the copyright owner or entity authorized by the copyright owner that is granting the License.

"Legal Entity" shall mean the union of the acting entity and all other entities that control, are controlled by, or are under common control with that entity. For the purposes of this definition, "control" means (i) the power, direct or indirect, to cause the direction or management of such entity, whether by contract or otherwise, or (ii) ownership of fifty percent (50%) or more of the outstanding shares, or (iii) beneficial ownership of such entity.

"You" (or "Your") shall mean an individual or Legal Entity exercising permissions granted by this License.

"Source" form shall mean the preferred form for making modifications, including but not limited to software source code, documentation source, and configuration files.

"Object" form shall mean any form resulting from mechanical transformation or translation of a Source form, including but not limited to compiled object code, generated documentation, and conversions to other media types.

"Work" shall mean the work of authorship, whether in Source or Object form, made available under the License, as indicated by a copyright notice that is included in or attached to the work (an example is provided in the Appendix below).

"Derivative Works" shall mean any work, whether in Source or Object form, that is based on (or derived from) the Work and for which the editorial revisions, annotations, elaborations, or other modifications represent, as a whole, an original work of authorship. For the purposes of this License, Derivative Works shall not include works that remain separable from, or merely link (or bind by name) to the interfaces of, the Work and Derivative Works thereof.

"Contribution" shall mean any work of authorship, including the original version of the Work and any modifications or additions to that Work or Derivative Works thereof, that is intentionally submitted to Licensor for inclusion in the Work by the copyright owner or by an individual or Legal Entity authorized to submit on behalf of the copyright owner. For the purposes of this definition, "submitted" means any form of electronic, verbal, or written communication sent to the Licensor or its representatives, including but not limited to communication on electronic mailing lists, source code control systems, and issue tracking systems that are managed by, or on behalf of, the Licensor for the purpose of discussing and improving the Work, but excluding communication that is conspicuously marked or otherwise designated in writing by the copyright owner as "Not a Contribution."

"Contributor" shall mean Licensor and any individual or Legal Entity on behalf of whom a Contribution has been received by Licensor and subsequently incorporated within the Work.

2. Grant of Copyright License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable copyright license to reproduce, prepare Derivative Works of, publicly display, publicly perform, sublicense, and distribute the Work and such Derivative Works in Source or Object form.

3. Grant of Patent License. Subject to the terms and conditions of this License, each Contributor hereby grants to You a perpetual, worldwide, non-exclusive, no-charge, royalty-free, irrevocable (except as stated in this section) patent license to make, have made, use, offer to sell, sell, import, and otherwise transfer the Work, where such license applies only to those patent claims licensable by such Contributor that are necessarily infringed by their Contribution(s) alone or by combination of their Contribution(s) with the Work to which such Contribution(s) was submitted. If You institute patent litigation against any entity (including a cross-claim or counterclaim in a lawsuit) alleging that the Work or a Contribution incorporated within the Work constitutes direct or contributory patent infringement, then any patent licenses granted to You under this License for that Work shall terminate as of the date such litigation is filed.

4. Redistribution. You may reproduce and distribute copies of the Work or Derivative Works thereof in any medium, with or without modifications, and in Source or Object form, provided that You meet the following conditions:

     (a) You must give any other recipients of the Work or Derivative Works a copy of this License; and

     (b) You must cause any modified files to carry prominent notices stating that You changed the files; and

     (c) You must retain, in the Source form of any Derivative Works that You distribute, all copyright, patent, trademark, and attribution notices from the Source form of the Work, excluding those notices that do not pertain to any part of the Derivative Works; and

     (d) If the Work includes a "NOTICE" text file as part of its distribution, then any Derivative Works that You distribute must include a readable copy of the attribution notices contained within such NOTICE file, excluding those notices that do not pertain to any part of the Derivative Works, in at least one of the following places: within a NOTICE text file distributed as part of the Derivative Works; within the Source form or documentation, if provided along with the Derivative Works; or, within a display generated by the Derivative Works, if and wherever such third-party notices normally appear. The contents of the NOTICE file are for informational purposes only and do not modify the License. You may add Your own attribution notices within Derivative Works that You distribute, alongside or as an addendum to the NOTICE text from the Work, provided that such additional attribution notices cannot be construed as modifying the License.

     You may add Your own copyright statement to Your modifications and may provide additional or different license terms and conditions for use, reproduction, or distribution of Your modifications, or for any such Derivative Works as a whole, provided Your use, reproduction, and distribution of the Work otherwise complies with the conditions stated in this License.

5. Submission of Contributions. Unless You explicitly state otherwise, any Contribution intentionally submitted for inclusion in the Work by You to the Licensor shall be under the terms and conditions of this License, without any additional terms or conditions. Notwithstanding the above, nothing herein shall supersede or modify the terms of any separate license agreement you may have executed with Licensor regarding such Contributions.

6. Trademarks. This License does not grant permission to use the trade names, trademarks, service marks, or product names of the Licensor, except as required for reasonable and customary use in describing the origin of the Work and reproducing the content of the NOTICE file.

7. Disclaimer of Warranty. Unless required by applicable law or agreed to in writing, Licensor provides the Work (and each Contributor provides its Contributions) on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied, including, without limitation, any warranties or conditions of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A PARTICULAR PURPOSE. You are solely responsible for determining the appropriateness of using or redistributing the Work and assume any risks associated with Your exercise of permissions under this License.

8. Limitation of Liability. In no event and under no legal theory, whether in tort (including negligence), contract, or otherwise, unless required by applicable law (such as deliberate and grossly negligent acts) or agreed to in writing, shall any Contributor be liable to You for damages, including any direct, indirect, special, incidental, or consequential damages of any character arising as a result of this License or out of the use or inability to use the Work (including but not limited to damages for loss of goodwill, work stoppage, computer failure or malfunction, or any and all other commercial damages or losses), even if such Contributor has been advised of the possibility of such damages.

9. Accepting Warranty or Additional Liability. While redistributing the Work or Derivative Works thereof, You may choose to offer, and charge a fee for, acceptance of support, warranty, indemnity, or other liability obligations and/or rights consistent with this License. However, in accepting such obligations, You may act only on Your own behalf and on Your sole responsibility, not on behalf of any other Contributor, and only if You agree to indemnify, defend, and hold each Contributor harmless for any liability incurred by, or claims asserted against, such Contributor by reason of your accepting any such warranty or additional liability.

END OF TERMS AND CONDITIONS

APPENDIX: How to apply the Apache License to your work.

To apply the Apache License to your work, attach the following boilerplate notice, with the fields enclosed by brackets "[]" replaced with your own identifying information. (Don't include the brackets!)  The text should be enclosed in the appropriate comment syntax for the file format. We also recommend that a file or class name and description of purpose be included on the same "printed page" as the copyright notice for easier identification within third-party archives.

Copyright [yyyy] [name of copyright owner]

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

### BSD-2-Clause

적용 구성요소: org.postgresql:postgresql

```text
Copyright (c) <year> <owner> 

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### BSD-3-Clause

적용 구성요소: org.codehaus.janino:janino

```text
Copyright (c) <year> <owner>. 

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

### LicenseRef-scancode-public-domain

적용 구성요소: org.json:json

```text
퍼블릭 도메인 — 저작권 고지·라이선스 전문 동봉 의무 없음
```

### MIT

적용 구성요소: net.logstash.logback:logstash-logback-encoder, org.projectlombok:lombok

```text
MIT License

Copyright (c) <year> <copyright holders>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.
```
