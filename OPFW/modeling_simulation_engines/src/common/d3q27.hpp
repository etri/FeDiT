// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// D3Q27 lattice velocity set shared by the LBM models in this directory.
// Direction i has velocity e_i = (cx, cy, cz) with i = (cx + 1) + 3 (cy + 1) + 9 (cz + 1),
// so i = 13 is the rest direction and the opposite of i is 26 - i.

#pragma once

#include "nflow_formula.hpp"

namespace nflow::d3q27
{
// x component of the lattice velocity e_i.
NFLOW_HD inline int cx(int i)
{
  constexpr int table[27] = { -1, 0, 1, -1, 0, 1, -1, 0, 1,  //
                              -1, 0, 1, -1, 0, 1, -1, 0, 1,  //
                              -1, 0, 1, -1, 0, 1, -1, 0, 1 };
  return table[i];
}

// y component of the lattice velocity e_i.
NFLOW_HD inline int cy(int i)
{
  constexpr int table[27] = { -1, -1, -1, 0, 0, 0, 1, 1, 1,  //
                              -1, -1, -1, 0, 0, 0, 1, 1, 1,  //
                              -1, -1, -1, 0, 0, 0, 1, 1, 1 };
  return table[i];
}

// z component of the lattice velocity e_i.
NFLOW_HD inline int cz(int i)
{
  constexpr int table[27] = { -1, -1, -1, -1, -1, -1, -1, -1, -1,  //
                              0,  0,  0,  0,  0,  0,  0,  0,  0,   //
                              1,  1,  1,  1,  1,  1,  1,  1,  1 };
  return table[i];
}

// Lattice weight w_i: 8/27 for the rest direction, 2/27 for the 6 face directions,
// 1/54 for the 12 edge directions and 1/216 for the 8 corner directions.
NFLOW_HD inline real weight(int i)
{
  constexpr real table[27] = {
    1.0 / 216.0, 1.0 / 54.0, 1.0 / 216.0, 1.0 / 54.0, 2.0 / 27.0, 1.0 / 54.0, 1.0 / 216.0, 1.0 / 54.0, 1.0 / 216.0,  //
    1.0 / 54.0,  2.0 / 27.0, 1.0 / 54.0,  2.0 / 27.0, 8.0 / 27.0, 2.0 / 27.0, 1.0 / 54.0,  2.0 / 27.0, 1.0 / 54.0,   //
    1.0 / 216.0, 1.0 / 54.0, 1.0 / 216.0, 1.0 / 54.0, 2.0 / 27.0, 1.0 / 54.0, 1.0 / 216.0, 1.0 / 54.0, 1.0 / 216.0
  };
  return table[i];
}

// Index of the direction with velocity -e_i (equals 26 - i in this ordering).
NFLOW_HD inline int opposite(int i)
{
  return (-cx(i) + 1) + (-cy(i) + 1) * 3 + (-cz(i) + 1) * 9;
}

// Lattice velocity e_i as a real-valued vector.
NFLOW_HD inline vec3 direction(int i)
{
  vec3 e;
  e[0] = static_cast<real>(cx(i));
  e[1] = static_cast<real>(cy(i));
  e[2] = static_cast<real>(cz(i));
  return e;
}
}  // namespace nflow::d3q27
