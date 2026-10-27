#!/usr/bin/env python3
# SPDX-License-Identifier: LGPL-2.1-only
# Copyright (c) 2026 E8IGHT Co., Ltd.
"""VTU(원시 이진 appended, 정육면체 셀) → 축소 ImageData(.vti) 변환기.

5.5 GB짜리 LEVEL_05 같은 파일을 브라우저가 다룰 크기로 줄인다.
factor배(2 또는 4)로 셀을 묶어 평균 낸다. solid=1(고체) 셀은 제외하고, 빈 칸은 NaN으로 둔다.
'fluid_fraction' 배열(묶음 안 유체 셀 비율)을 함께 쓴다. 메모리는 memmap + 청크로 억제한다.

사용: python downsample_vtu.py IN.vtu OUT_PREFIX --factors 4 2 --arrays velocity pressure ... --solid solid
      → OUT_PREFIX_ds4.vti, OUT_PREFIX_ds2.vti
"""
import argparse
import re
import struct
import sys
import time

import numpy as np

DT = {'Float64': np.float64, 'Float32': np.float32, 'Int32': np.int32, 'Int64': np.int64,
      'UInt8': np.uint8, 'UInt32': np.uint32, 'Int16': np.int16, 'UInt16': np.uint16}


def read_header(path):
    with open(path, 'rb') as f:
        head = f.read(1 << 20)
    txt = head.decode('latin-1')
    m = re.search(r'<AppendedData\s+encoding="raw">\s*_', txt)
    if not m:
        sys.exit('AppendedData(raw)를 찾지 못했습니다.')
    base = m.end()
    arrays = {}
    for t, n, nc, off in re.findall(r'<DataArray type="(\w+)" Name="([^"]*)" NumberOfComponents="(\d+)" offset="(\d+)"', txt[:base]):
        arrays[n or 'Points'] = (DT[t], int(nc), int(off))
    ncell = int(re.search(r'NumberOfCells="(\d+)"', txt).group(1))
    return base, arrays, ncell


def memmap_array(path, base, arr):
    dt, nc, off = arr
    with open(path, 'rb') as f:
        f.seek(base + off)
        nb = struct.unpack('<Q', f.read(8))[0]
    n = nb // (np.dtype(dt).itemsize * nc)
    return np.memmap(path, dtype=dt, mode='r', offset=base + off + 8, shape=(n, nc) if nc > 1 else (n,))


def write_vti(path, dims, origin, spacing, celldata):
    nx, ny, nz = (int(d) for d in dims)
    entries, offset = [], 0
    for name, arr in celldata.items():
        arr = np.ascontiguousarray(arr.astype('<f4'))
        nc = arr.shape[1] if arr.ndim > 1 else 1
        entries.append((name, nc, offset, arr))
        offset += 8 + arr.nbytes
    header = ('<?xml version="1.0"?>\n'
              '<VTKFile type="ImageData" version="1.0" byte_order="LittleEndian" header_type="UInt64">\n'
              f'<ImageData WholeExtent="0 {nx} 0 {ny} 0 {nz}" Origin="{origin[0]:.9g} {origin[1]:.9g} {origin[2]:.9g}" '
              f'Spacing="{spacing:.9g} {spacing:.9g} {spacing:.9g}">\n'
              f'<Piece Extent="0 {nx} 0 {ny} 0 {nz}">\n<PointData>\n</PointData>\n<CellData>\n')
    header += ''.join(f'<DataArray type="Float32" Name="{n}" NumberOfComponents="{nc}" format="appended" offset="{off}"/>\n'
                      for n, nc, off, _ in entries)
    header += '</CellData>\n</Piece>\n</ImageData>\n<AppendedData encoding="raw">\n_'
    with open(path, 'wb') as f:
        f.write(header.encode('ascii'))
        for _, _, _, arr in entries:
            f.write(struct.pack('<Q', arr.nbytes))
            f.write(arr.tobytes(order='C'))
        f.write(b'\n</AppendedData>\n</VTKFile>\n')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('input')
    ap.add_argument('out_prefix')
    ap.add_argument('--factors', type=int, nargs='+', default=[4])
    ap.add_argument('--arrays', nargs='+', default=['velocity', 'pressure', 'turbulent_viscosity', 'wall_shear_stress', 'y_plus'])
    ap.add_argument('--solid', default='solid')
    ap.add_argument('--chunk', type=int, default=2_000_000)
    a = ap.parse_args()

    t0 = time.time()
    base, arrays, ncell = read_header(a.input)
    pts = memmap_array(a.input, base, arrays['Points'])
    conn = memmap_array(a.input, base, arrays['connectivity'])
    offs = memmap_array(a.input, base, arrays['offsets'])
    # 일부 파일은 offsets 크기 헤더가 실제의 2배로 적혀 있어 앞 ncell개만 본다
    if int(offs[0]) != 8 or int(offs[ncell - 1]) != ncell * 8:
        sys.exit(f'정육면체(8점) 셀만 지원합니다. offsets[0]={int(offs[0])}, offsets[ncell-1]={int(offs[ncell-1])}, ncell*8={ncell*8}')
    conn2 = conn.reshape(ncell, 8)
    p0, p6 = np.asarray(pts[int(conn2[0, 0])]), np.asarray(pts[int(conn2[0, 6])])
    h = float(abs(p6[0] - p0[0]))
    print(f'cells {ncell:,}  cell size {h}  read header {time.time()-t0:.1f}s', flush=True)

    # 꼭짓점 범위 → 셀 경계에 맞춘 원점
    mn, mx = np.full(3, np.inf), np.full(3, -np.inf)
    for s in range(0, pts.shape[0], 4_000_000):
        c = np.asarray(pts[s:s + 4_000_000])
        mn, mx = np.minimum(mn, c.min(0)), np.maximum(mx, c.max(0))
    print(f'bounds {mn} .. {mx}', flush=True)

    solid = memmap_array(a.input, base, arrays[a.solid]) if a.solid in arrays else None
    fields = {n: memmap_array(a.input, base, arrays[n]) for n in a.arrays if n in arrays}
    ncomp = {n: (arr.shape[1] if arr.ndim > 1 else 1) for n, arr in fields.items()}

    acc = {}
    for F in a.factors:
        H = h * F
        dims = np.maximum(1, np.ceil((mx - mn) / H - 1e-6)).astype(np.int64)
        total = int(np.prod(dims))
        acc[F] = dict(H=H, dims=dims, total=total, count=np.zeros(total),
                      sums={n: np.zeros((total, ncomp[n])) for n in fields})
        print(f'factor {F}: spacing {H}  dims {dims}  cells {total:,}', flush=True)

    for s in range(0, ncell, a.chunk):
        e = min(ncell, s + a.chunk)
        idx0 = np.asarray(conn2[s:e, 0]); idx6 = np.asarray(conn2[s:e, 6])
        c = (np.asarray(pts[idx0]) + np.asarray(pts[idx6])) * 0.5
        keep = np.ones(e - s, bool) if solid is None else (np.asarray(solid[s:e]) == 0)
        c = c[keep]
        vals = {}
        for n, arr in fields.items():
            v = np.asarray(arr[s:e])[keep]
            vals[n] = v.reshape(len(v), -1)
        for F, A in acc.items():
            ijk = np.floor((c - mn) / A['H']).astype(np.int64)
            ijk = np.minimum(np.maximum(ijk, 0), A['dims'] - 1)
            lin = ijk[:, 0] + A['dims'][0] * (ijk[:, 1] + A['dims'][1] * ijk[:, 2])
            A['count'] += np.bincount(lin, minlength=A['total'])
            for n, v in vals.items():
                for k in range(v.shape[1]):
                    A['sums'][n][:, k] += np.bincount(lin, weights=v[:, k], minlength=A['total'])
        print(f'  {e:,}/{ncell:,}  {time.time()-t0:.0f}s', flush=True)

    for F, A in acc.items():
        cnt = A['count']
        out = {}
        for n, sm in A['sums'].items():
            avg = np.full_like(sm, np.nan)
            np.divide(sm, cnt[:, None], out=avg, where=cnt[:, None] > 0)
            out[n] = avg if ncomp[n] > 1 else avg[:, 0]
        out['fluid_fraction'] = (cnt / float(F ** 3)).astype(np.float32)
        path = f'{a.out_prefix}_ds{F}.vti'
        write_vti(path, A['dims'], mn, A['H'], out)
        print(f'wrote {path}  filled {int((cnt > 0).sum()):,}/{A["total"]:,}  {time.time()-t0:.0f}s', flush=True)


if __name__ == '__main__':
    main()
