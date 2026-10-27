#!/usr/bin/env python3
# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
"""연합트윈 도시 CFD 렌더러용 합성(synthetic) 샘플 데이터 생성기.

실제 솔버(1세부) 결과가 나오기 전까지 렌더러를 만들고 시험하기 위한 데이터다.
도시 블록(건물 상자 12동) 주변의 바람·압력·오염물질 농도·온도·난류 에너지를
경험식으로 만들어 낸다 (물리적으로 정확한 해석 결과는 아님). 화면에는 따로 안내 문구를
띄우지 않는다(2026-09-17 결정).

출력 (기본 --out .):
  sample_city_cfd.csv          해석 결과 (열: x,y,z,u,v,w,p,c,T,k)
  sample_city_buildings.stl    건물 형상 (ASCII STL)
  sample_city_buildings.json   건물 상자 목록
  sample_city_meta.json        도메인·바람·열 설명·단위 (렌더러 안내문에 사용)

사용:  python gen_city_cfd.py [--dx 4] [--out DIR] [--seed 7]
"""
import argparse
import json
import os

import numpy as np

# ---- 도메인 (m). z는 위쪽(연직) ----
LX, LY, LZ = 240.0, 160.0, 80.0

# ---- 건물: (이름, x0, y0, x길이, y길이, 높이) ----
# 두 줄의 건물 사이에 y≈80 도로(스트리트 캐니언)가 있고, 남쪽에 고층 타워 하나.
BUILDINGS = [
    ("A1", 70, 40, 22, 30, 20),
    ("A2", 100, 40, 22, 30, 35),
    ("A3", 130, 40, 22, 30, 28),
    ("A4", 160, 40, 26, 30, 45),
    ("B1", 65, 90, 22, 30, 15),
    ("B2", 95, 90, 24, 30, 50),
    ("B3", 127, 90, 22, 30, 24),
    ("B4", 157, 90, 22, 30, 30),
    ("B5", 187, 90, 20, 30, 18),
    ("T1", 110, 8, 24, 24, 60),
    ("M1", 150, 128, 40, 24, 12),
    ("C1", 30, 120, 18, 18, 10),
]

# ---- 바람 (서쪽 -> 동쪽, +x 방향) ----
U_REF, Z_REF, Z0 = 5.0, 10.0, 0.5   # 기준 풍속 m/s, 기준 높이 m, 거칠기 길이 m (도시)
RHO = 1.2                            # 공기 밀도 kg/m3

# ---- 오염 배출원: (이름, x, y, z, 배출량 g/s) ----
SOURCES = [
    ("도로 배출(캐니언 서측 입구)", 40.0, 80.0, 2.0, 0.8),
    ("굴뚝(B2 옥상)", 107.0, 105.0, 53.0, 2.5),
]


def log_profile(z):
    """대기경계층 로그 풍속 분포: U(z) = U_ref * ln((z+z0)/z0) / ln((z_ref+z0)/z0)."""
    return U_REF * np.log((z + Z0) / Z0) / np.log((Z_REF + Z0) / Z0)


def make_grid(dx):
    xs = np.arange(0.0, LX + 1e-6, dx)
    ys = np.arange(0.0, LY + 1e-6, dx)
    zs = np.arange(dx / 2, LZ, dx)          # 첫 층은 지면에서 반 칸 위
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing="ij")
    return X.ravel(), Y.ravel(), Z.ravel()


def build_fields(X, Y, Z, rng):
    n = X.size
    u0 = log_profile(Z)
    u = u0.copy()
    v = np.zeros(n)
    w = np.zeros(n)
    cp = np.zeros(n)          # 압력계수 누적
    wake = np.zeros(n)        # 후류(건물 뒤 정체 영역) 강도 0~1, 농도 갇힘·온도에 사용
    solid = np.zeros(n, bool)

    for _, x0, y0, wx, dy, h in BUILDINGS:
        x1, y1 = x0 + wx, y0 + dy
        yc = 0.5 * (y0 + y1)
        below = Z <= h
        in_x = (X >= x0) & (X <= x1)
        in_y = (Y >= y0) & (Y <= y1)

        # 건물 내부 = 고체. 결과 파일에서 제외한다.
        solid |= in_x & in_y & below

        # 후류: 건물 뒤(+x) 약 3H 길이, 뒤로 갈수록 낮아지는 쐐기 모양
        dxw = X - x1
        wk = (dxw > 0) & (dxw < 3 * h) & (Y >= y0 - 3) & (Y <= y1 + 3) & (Z <= h * (1 - dxw / (3.2 * h)) + 2)
        f = np.where(wk, 0.85 * np.exp(-dxw / (1.2 * h)), 0.0)
        u *= 1 - f
        # 바로 뒤 지면 근처는 역류(재순환)
        rc = wk & (dxw < 0.6 * h) & (Z < 0.6 * h)
        u[rc] -= 0.25 * U_REF * (1 - dxw[rc] / (0.6 * h))
        v -= 0.15 * U_REF * np.sign(Y - yc) * f          # 옆에서 후류 중심으로 유입
        cp -= 0.5 * f
        wake = np.maximum(wake, f)

        # 풍상측(건물 앞면): 정체 -> 감속, 지면 쪽 하강류·상단 쪽 상승류
        dxf = x0 - X
        fr = (dxf > 0) & (dxf < 0.8 * h) & in_y & below
        g = np.where(fr, np.exp(-dxf / (0.3 * h)), 0.0)
        u *= 1 - 0.8 * g
        w += U_REF * g * (0.6 * (Z / h) - 0.25)
        cp += 0.8 * g

        # 측면: 모서리 가속과 바깥쪽으로 밀리는 흐름
        side_w = 0.4 * dy
        dist_lo = y0 - Y            # 남쪽 측면 바깥 거리
        dist_hi = Y - y1            # 북쪽 측면 바깥 거리
        for dist, sgn in ((dist_lo, -1.0), (dist_hi, 1.0)):
            sd = (X >= x0 - 0.2 * h) & (X <= x1) & below & (dist > 0) & (dist < side_w)
            s = np.where(sd, np.exp(-dist / (0.35 * side_w)), 0.0)
            u *= 1 + 0.3 * s
            v += sgn * 0.2 * U_REF * s
            cp -= 0.4 * s

        # 옥상: 앞모서리 박리 -> 감속, 약한 상승류
        rf = in_x & in_y & (Z > h) & (Z < h + 0.35 * h)
        t = np.where(rf, (Z - h) / (0.35 * h), 1.0)
        u *= 0.6 + 0.4 * t
        lead = np.where(rf, 1 - (X - x0) / max(wx, 1e-6), 0.0)
        w += 0.15 * U_REF * lead * np.where(rf, np.exp(-(Z - h) / (0.2 * h)), 0.0)
        cp -= 0.6 * np.where(rf, (1 - t) * lead, 0.0)

    # 압력: 정압 기준 압력계수 + 속도 편차(베르누이) + 잡음
    speed2 = u * u + v * v + w * w
    p = 0.5 * RHO * U_REF ** 2 * cp - 0.3 * 0.5 * RHO * (speed2 - u0 * u0)
    p += rng.normal(0, 0.4, n)

    # 농도: 가우시안 플룸(Pasquill-Gifford D 등급 근사) + 후류 갇힘 효과. 단위 µg/m3
    c = np.zeros(n)
    for _, sx, sy, sz, q in SOURCES:
        xd = X - sx
        m = xd > 0.5
        # 확산 폭은 불안정 대기(B~C 등급)에 가깝게 잡아 4 m 격자에서도 플룸이 여러 칸에 걸치게 한다
        sig_y = 0.16 * xd / np.sqrt(1 + 0.0001 * xd)
        sig_z = 0.12 * xd / np.sqrt(1 + 0.0015 * xd)
        ueff = max(float(log_profile(np.array([sz]))[0]), 0.8)
        with np.errstate(divide="ignore", invalid="ignore"):
            term = (q * 1e6) / (2 * np.pi * ueff * sig_y * sig_z)
            term *= np.exp(-(Y - sy) ** 2 / (2 * sig_y ** 2))
            term *= np.exp(-(Z - sz) ** 2 / (2 * sig_z ** 2)) + np.exp(-(Z + sz) ** 2 / (2 * sig_z ** 2))
        c += np.where(m, np.nan_to_num(term), 0.0)
    c *= 1 + 1.5 * wake
    # 배출원 바로 옆은 플룸식이 발산하므로 상한을 두어 색 범위가 깨지지 않게 한다.
    c = np.clip(c * (1 + rng.normal(0, 0.05, n)), 0, 5000.0)

    # 온도 K: 고도 감률 + 지표 근처 도시열 + 후류 정체 가열
    T = 300.0 - 0.0065 * Z + 0.8 * np.exp(-Z / 15.0) + 2.0 * wake + rng.normal(0, 0.05, n)

    # 난류운동에너지 m2/s2: 배경 + 평균류 편차
    k = 0.03 * u0 ** 2 + 0.3 * (u0 - np.sqrt(speed2)) ** 2 + 0.02
    k = np.clip(k * (1 + rng.normal(0, 0.03, n)), 0, None)

    return solid, u, v, w, p, c, T, k


def write_stl(path):
    tri_of = [  # 상자의 12개 삼각형: (법선, 꼭짓점 인덱스 3개) — 바깥 방향
        ((0, 0, -1), (0, 2, 1)), ((0, 0, -1), (0, 3, 2)),
        ((0, 0, 1), (4, 5, 6)), ((0, 0, 1), (4, 6, 7)),
        ((0, -1, 0), (0, 1, 5)), ((0, -1, 0), (0, 5, 4)),
        ((1, 0, 0), (1, 2, 6)), ((1, 0, 0), (1, 6, 5)),
        ((0, 1, 0), (2, 3, 7)), ((0, 1, 0), (2, 7, 6)),
        ((-1, 0, 0), (3, 0, 4)), ((-1, 0, 0), (3, 4, 7)),
    ]
    lines = ["solid city_buildings"]
    for name, x0, y0, wx, dy, h in BUILDINGS:
        x1, y1 = x0 + wx, y0 + dy
        vs = [(x0, y0, 0), (x1, y0, 0), (x1, y1, 0), (x0, y1, 0),
              (x0, y0, h), (x1, y0, h), (x1, y1, h), (x0, y1, h)]
        for nrm, idx in tri_of:
            lines.append(f"  facet normal {nrm[0]} {nrm[1]} {nrm[2]}")
            lines.append("    outer loop")
            for i in idx:
                lines.append(f"      vertex {vs[i][0]:.3f} {vs[i][1]:.3f} {vs[i][2]:.3f}")
            lines.append("    endloop")
            lines.append("  endfacet")
    lines.append("endsolid city_buildings")
    with open(path, "w", encoding="ascii") as f:
        f.write("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dx", type=float, default=4.0, help="격자 간격 m (기본 4)")
    ap.add_argument("--out", default=".", help="출력 폴더")
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    rng = np.random.default_rng(a.seed)

    X, Y, Z = make_grid(a.dx)
    solid, u, v, w, p, c, T, k = build_fields(X, Y, Z, rng)
    keep = ~solid
    cols = np.column_stack([X, Y, Z, u, v, w, p, c, T, k])[keep]

    csv_path = os.path.join(a.out, "sample_city_cfd.csv")
    np.savetxt(csv_path, cols, delimiter=",", header="x,y,z,u,v,w,p,c,T,k", comments="",
               fmt=["%.2f", "%.2f", "%.2f", "%.4f", "%.4f", "%.4f", "%.3f", "%.4g", "%.3f", "%.4f"])

    write_stl(os.path.join(a.out, "sample_city_buildings.stl"))
    with open(os.path.join(a.out, "sample_city_buildings.json"), "w", encoding="utf-8") as f:
        json.dump([{"name": n, "x0": x0, "y0": y0, "x1": x0 + wx, "y1": y0 + dy, "height": h}
                   for n, x0, y0, wx, dy, h in BUILDINGS], f, ensure_ascii=False, indent=2)

    meta = {
        "kind": "synthetic",
        "generator": "gen_city_cfd.py",
        "domain_m": {"x": [0, LX], "y": [0, LY], "z": [0, LZ]},
        "spacing_m": a.dx,
        "points": int(keep.sum()),
        "wind": {"direction": "+x (서→동)", "u_ref_mps": U_REF, "z_ref_m": Z_REF, "z0_m": Z0},
        "sources": [{"name": n, "x": x, "y": y, "z": z, "q_gps": q} for n, x, y, z, q in SOURCES],
        "columns": {
            "x": {"desc": "동서 좌표", "unit": "m"}, "y": {"desc": "남북 좌표", "unit": "m"},
            "z": {"desc": "높이(연직)", "unit": "m"},
            "u": {"desc": "풍속 x성분", "unit": "m/s"}, "v": {"desc": "풍속 y성분", "unit": "m/s"},
            "w": {"desc": "풍속 z성분", "unit": "m/s"},
            "p": {"desc": "게이지 압력", "unit": "Pa"},
            "c": {"desc": "오염물질 농도", "unit": "µg/m³"},
            "T": {"desc": "기온", "unit": "K"},
            "k": {"desc": "난류운동에너지", "unit": "m²/s²"},
        },
    }
    with open(os.path.join(a.out, "sample_city_meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, ensure_ascii=False, indent=2)

    print(f"points kept {keep.sum():,} / {keep.size:,}  (dx={a.dx} m)")
    print(f"csv {os.path.getsize(csv_path) / 1e6:.1f} MB -> {csv_path}")
    for name, arr in (("u", u), ("v", v), ("w", w), ("p", p), ("c", c), ("T", T), ("k", k)):
        print(f"  {name}: {arr[keep].min():.3f} .. {arr[keep].max():.3f}")


if __name__ == "__main__":
    main()
