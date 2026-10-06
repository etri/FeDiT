// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Equilibrium of the concentration distribution g_i on the D3Q27 lattice.
// The equilibrium is linear in the velocity, g_i^eq = C w_i (1 + e_i . u / c_s^2)
// with c_s^2 = 1/3. Its zeroth moment is C and its first moment is C u.

#pragma once

#include "../common/nflow_formula.hpp"
#include "../common/d3q27.hpp"

namespace nflow
{
namespace concentration_diffusion
{
using d3q27::direction;
using d3q27::weight;

// Concentration equilibrium g_i^eq = C w_i (1 + 3 e_i . u).
// velocity: fluid velocity u, concentration: C (both in lattice units).
NFLOW_HD inline dist27 equilibrium_HR(vec3 const& velocity, real concentration)
{
  dist27 ret;

  for (int i = 0; i < 27; ++i)
  {
    vec3 direct = direction(i);
    real e_dot_u = dot(direct, velocity);

    ret[i] = concentration * weight(i) * (1.0 + 3.0 * e_dot_u);
  }

  return ret;
}

}  // namespace concentration_diffusion
}  // namespace nflow
