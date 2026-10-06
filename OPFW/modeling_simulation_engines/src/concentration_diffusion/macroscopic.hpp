// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Macroscopic concentration from the concentration distribution g_i.
// C is the zeroth moment of g plus half of the source term of the current step.
// The collision step (collision.hpp) applies the same source with the weight (1 - omega/2).

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow
{
namespace concentration_diffusion
{

// Concentration C = sum_i g_i + S / 2.
// The sum is grouped by the planes ex = -1, ex = +1 and ex = 0 (see ../common/d3q27.hpp).
// g: concentration distribution after streaming and boundary treatment,
// conc_source: source term S per time step (lattice units).
NFLOW_HD inline real macroscopic_concentration(dist27 const& g, real conc_source)
{
  real concentration;

  real X_M1 = g[0] + g[3] + g[6] + g[9] + g[12] + g[15] + g[18] + g[21] + g[24];
  real X_P1 = g[2] + g[5] + g[8] + g[11] + g[14] + g[17] + g[20] + g[23] + g[26];
  real X_0 = g[1] + g[4] + g[7] + g[10] + g[13] + g[16] + g[19] + g[22] + g[25];

  concentration = X_M1 + X_P1 + X_0 + (0.5 * conc_source);

  return concentration;
}

}  // namespace concentration_diffusion
}  // namespace nflow
