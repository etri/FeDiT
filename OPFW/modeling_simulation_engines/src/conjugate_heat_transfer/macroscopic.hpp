// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Macroscopic temperature from the temperature distribution g:
// T = sum_i g_i + s / 2, where s = q / (rho c_p) is the heat source term.
// Also defines the per-cell state used by the collision and regularization.

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow::conjugate_heat_transfer
{
// Temperature and velocity of a cell at the current and the previous time
// step. The velocity is zero in a conducting solid.
struct transport_state
{
  real temperature;           // T(t)
  real temperature_previous;  // T(t - dt)
  vec3 velocity;              // u(t)
  vec3 velocity_previous;     // u(t - dt)
};

// Temperature as the zeroth moment of g plus half the heat source term:
// T = sum_i g_i + s / 2. The sum is taken over the planes cx = -1, +1, 0.
NFLOW_HD inline real macroscopic_temperature(const dist27& g, real heat_source)
{
  real x_m1 = g[0] + g[3] + g[6] + g[9] + g[12] + g[15] + g[18] + g[21] + g[24];
  real x_p1 = g[2] + g[5] + g[8] + g[11] + g[14] + g[17] + g[20] + g[23] + g[26];
  real x_0 = g[1] + g[4] + g[7] + g[10] + g[13] + g[16] + g[19] + g[22] + g[25];

  real temperature = x_m1 + x_p1 + x_0 + (0.5 * heat_source);

  return temperature;
}
}  // namespace nflow::conjugate_heat_transfer
