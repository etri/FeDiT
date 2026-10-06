# 농도확산 해석기 (concentration_diffusion)

이 해석기는 유동장 속에서 스칼라 농도 C가 흐름을 따라 이동하고 확산하는 이송-확산 방정식을 D3Q27 격자 볼츠만 방법으로 푼다. 유동은 별도의 분포 함수로 풀고, 농도는 두 번째 분포 함수 g_i로 푼다. 이 폴더에는 농도 분포 g_i에 쓰이는 식만 담았다.

## 파일별 내용

| 파일 | 공개 함수 | 담은 식 |
|---|---|---|
| `equilibrium.hpp` | `equilibrium_HR` | 농도 평형분포 g_i^eq = C w_i (1 + 3 e_i·u) |
| `non_equilibrium.hpp` | `nonequilibrium_HR` | 정칙화한 비평형 성분. 1차 비평형 모멘트를 g − g^eq에서 투영한 값과 농도 기울기로 다시 만든 값(−c_s² τ ∇C − ½ Δ(Cu))을 sigma_HR로 섞고, 이 1차 항으로만 g_i^neq를 재구성한다. 여기서 τ = 3 (D + ν_t/Sc_t) + ½ |
| `collision.hpp` | `sensor_gated_diffusivity`, `relaxation_rate`, `collision_HR` | 선택적 인공 확산 D + D_art·s, 이완율 ω = 1/(3 D_eff + ½)과 D_eff = D + D_art·s + ν_t/Sc_t, 충돌 후 분포 g_i* = g_i^eq + (1 − ω) g_i^neq + (1 − ω/2) w_i (3 e_i·Δ(Cu) + S) |
| `macroscopic.hpp` | `macroscopic_concentration` | 농도 C = Σ g_i + S/2 |
| `boundary.hpp` | `equilibrium_boundary`, `extrapolated_concentration`, `zero_gradient_concentration`, `halfway_bounce_back` | 평형 경계 g_i = g_i^eq(u_b, C_b), 출구 농도의 1차 외삽과 영기울기 조건, 벽의 halfway bounce-back |

D3Q27 방향 번호·격자 속도 e_i·가중치 w_i·반대 방향 번호는 `../common/d3q27.hpp`에, 내적 `dot`은 `../common/nflow_formula.hpp`에 있다.

한 시간 단계 안에서 이 식들은 다음 순서로 쓰인다. 충돌(`collision_HR`)로 g*를 만들고, 이웃 셀로 옮기는 streaming을 거친 뒤 경계 셀에 경계 조건을 적용한다. 그다음 `macroscopic_concentration`으로 C를 구하고, 새 C와 u로 `equilibrium_HR`과 `nonequilibrium_HR`을 계산해 다음 충돌의 입력으로 넘긴다. streaming과 농도 기울기 ∇C의 계산은 이 폴더에 없다.

입구 경계에서는 C_b가 지정값이다. 출구에서는 도메인 내부 경계면이면 `extrapolated_concentration`, 도메인 외곽 면이면 `zero_gradient_concentration`으로 C_b를 정한다. 벽과 움직이는 벽에서는 g에 보정 항 없이 bounce-back만 적용하므로 벽을 통과하는 농도 플럭스가 없다.

## 주요 기호

| 기호 | 뜻 |
|---|---|
| g_i | 농도 분포 함수 (i = 0…26) |
| g_i^eq, g_i^neq, g_i* | 평형분포, 정칙화한 비평형 성분, 충돌 후 분포 |
| e_i, w_i | 격자 속도와 가중치 |
| c_s² | 격자 음속의 제곱, 1/3 |
| C, C_prev | 현재 단계와 이전 단계의 농도 |
| u, u_prev | 현재 단계와 이전 단계의 유속 |
| Δ(Cu) | C u − C_prev u_prev, 한 단계 동안 이송 플럭스의 변화 |
| S | 단계당 농도 소스 |
| D, D_eff | 분자 확산계수, 유효 확산계수. 충돌에서는 D_eff = D + D_art·s + ν_t/Sc_t, 정칙화에서는 D + ν_t/Sc_t (센서 항 없음) |
| ν_t, Sc_t | 난류 점성(난류 모델을 쓰지 않으면 0)과 난류 Schmidt 수. ν_t/Sc_t가 난류 확산계수다 |
| τ, ω | 이완 시간 τ = 3 D_eff + ½, 이완율 ω = 1/τ |
| sigma_HR | 투영 모멘트와 재구성 모멘트의 혼합 비율 (1이면 투영 값만 쓴다) |
| D_art, K | 인공 확산의 최대값과 센서 임계값. s = \|∇C\|² / (\|∇C\|² + K²). D_art가 0이면 꺼진다 |

모든 값은 격자 단위다.

## 참고

- 모델: 농도 분포를 위한 정칙화(HR) 격자 볼츠만 모델. 2차 이상 비평형 모멘트를 버리고 1차 항만 재구성하는 방식은 Wang (2015)과 Chai의 연구를 따른 것이다. 원본에 정확한 서지 정보가 없어 저자와 연도만 적는다.
- 공개 예제 `examples/03_concentration_diffusion`은 Zhang et al. (2012), Phys. Rev. E 85, 016701의 III.B 절(벽 주입 Couette 유동) 벤치마크 조건을 따른다.

이 폴더는 농도확산 해석기의 물리 식 부분만 담았으며, 단독으로 빌드되는 해석기가 아니다. 격자 자료구조, streaming, 다중레벨 격자, 유동 분포의 충돌, 난류 점성 ν_t를 구하는 난류 모델, 시간 진행은 들어 있지 않다.
