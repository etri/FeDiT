// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Wetting at solid nodes. A solid node takes the weighted average density of
// its fluid neighbors, rho_s = sum_i w_i rho(x + e_i) / sum_i w_i. Its effective
// mass then follows from the equation of state and enters the interaction force
// of the neighboring fluid nodes together with the wall strength G_w.

#pragma once

#include "../common/nflow_formula.hpp"
#include "../common/d3q27.hpp"

namespace nflow::multiphase
{
using d3q27::weight;

// Density of a solid node from its neighbors along i = 0..26.
// neighbor_is_fluid[i] is false for solid or missing neighbors; those are skipped.
// At least one fluid neighbor is needed; otherwise the result is 0 / 0.
NFLOW_HD inline real solid_node_density(const real neighbor_density[27], const bool neighbor_is_fluid[27])
{
  real sum = 0.;
  real density_ref = 0.;

  for (int dir = 0; dir < 27; ++dir)
  {
    if (!neighbor_is_fluid[dir])
    {
      continue;
    }

    real w = weight(dir);
    sum += w;

    real density = neighbor_density[dir];
    density_ref += density * w;
  }

  density_ref /= sum;
  return density_ref;
}
}  // namespace nflow::multiphase
