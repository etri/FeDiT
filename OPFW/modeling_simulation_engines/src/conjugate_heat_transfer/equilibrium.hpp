// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Equilibrium of the temperature distribution, linear in the velocity:
// g_i^eq = T w_i (1 + 3 e_i . u). The same form is used in the fluid and in
// the conducting solid, where u = 0.

#pragma once

#include "../common/nflow_formula.hpp"
#include "lattice.hpp"

namespace nflow::conjugate_heat_transfer
{
// Equilibrium g_i^eq = T w_i (1 + 3 e_i . u) for temperature T and velocity u.
NFLOW_HD inline dist27 equilibrium_HR(const vec3& velocity, real temperature)
{
  dist27 ret;

  for (int i = 0; i < 27; ++i)
  {
    real e_dot_u = project(i, velocity);

    ret[i] = temperature * weight(i) * (1.0 + 3.0 * e_dot_u);
  }

  return ret;
}
}  // namespace nflow::conjugate_heat_transfer
