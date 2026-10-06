// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Macroscopic quantities of the two-component model: the order parameter
// from G, density and viscosity interpolated by the order parameter, the
// velocity from F with the half-force correction, and the pressure update
// from the zeroth moment of the normalised flow population F.
//
// Distribution entries follow the direction order of ../common/d3q27.hpp:
//   i = (cx + 1) + 3 (cy + 1) + 9 (cz + 1),   cx, cy, cz in {-1, 0, +1}.

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow::multi_component
{
// Order parameter phi = sum_i g_i + S / 2.
// g: distribution of G; source: S, source of phi per time step.
NFLOW_HD inline real macroscopic_order_parameter(const dist27& g, real source)
{
  real G_M1 = g[0] + g[3] + g[6] + g[9] + g[12] + g[15] + g[18] + g[21] + g[24];
  real G_P1 = g[2] + g[5] + g[8] + g[11] + g[14] + g[17] + g[20] + g[23] + g[26];
  real G_00 = g[1] + g[4] + g[7] + g[10] + g[13] + g[16] + g[19] + g[22] + g[25];

  real order_parameter = G_M1 + G_P1 + G_00 + 0.5 * source;
  return order_parameter;
}

// Linear interpolation of a material property by the order parameter,
// q = q_L + phi (q_H - q_L). Used for the density rho and the dynamic
// viscosity mu; H is the heavier fluid (phi = 1), L the lighter (phi = 0).
// order_parameter: phi; value_high, value_low: q_H, q_L.
NFLOW_HD inline real mixture_property(real order_parameter, real value_high, real value_low)
{
  return value_low + order_parameter * (value_high - value_low);
}

// Kinematic viscosity seen by the flow, nu = mu / rho + nu_t.
// density: rho; dynamic_viscosity: mu; turbulent_viscosity: nu_t (zero
// without a turbulence model).
NFLOW_HD inline real effective_kinematic_viscosity(real density,
                                                   real dynamic_viscosity,
                                                   real turbulent_viscosity)
{
  real kinematic_viscosity = dynamic_viscosity / density;
  kinematic_viscosity += turbulent_viscosity;
  return kinematic_viscosity;
}

// Velocity u = sum_i f_i c_i + F / (2 rho). F is normalised by the density,
// so its first moment is the velocity.
// f: distribution of F; force: total force per unit volume; density: rho.
NFLOW_HD inline vec3 macroscopic_velocity(const dist27& f, const vec3& force, real density)
{
  real X_M1 = f[0] + f[3] + f[6] + f[9] + f[12] + f[15] + f[18] + f[21] + f[24];
  real X_P1 = f[2] + f[5] + f[8] + f[11] + f[14] + f[17] + f[20] + f[23] + f[26];

  real Y_M1 = f[0] + f[1] + f[2] + f[9] + f[10] + f[11] + f[18] + f[19] + f[20];
  real Y_P1 = f[6] + f[7] + f[8] + f[15] + f[16] + f[17] + f[24] + f[25] + f[26];

  real Z_M1 = f[0] + f[1] + f[2] + f[3] + f[4] + f[5] + f[6] + f[7] + f[8];
  real Z_P1 = f[18] + f[19] + f[20] + f[21] + f[22] + f[23] + f[24] + f[25] + f[26];

  vec3 velocity;
  velocity[0] = (X_P1 - X_M1) + 0.5 * force[0] / density;
  velocity[1] = (Y_P1 - Y_M1) + 0.5 * force[1] / density;
  velocity[2] = (Z_P1 - Z_M1) + 0.5 * force[2] / density;
  return velocity;
}

// Pressure update p_new = p + rho c_s^2 (sum_i f_i - 1), c_s^2 = 1/3.
// The result is the unfiltered pressure; pressure_filter (filter.hpp) turns it
// into the pressure p of the next step.
// pressure: p from the previous step; f: distribution of F; density: rho.
NFLOW_HD inline real update_pressure(real pressure, const dist27& f, real density)
{
  real X_M1 = f[0] + f[3] + f[6] + f[9] + f[12] + f[15] + f[18] + f[21] + f[24];
  real X_P1 = f[2] + f[5] + f[8] + f[11] + f[14] + f[17] + f[20] + f[23] + f[26];
  real X_00 = f[1] + f[4] + f[7] + f[10] + f[13] + f[16] + f[19] + f[22] + f[25];

  pressure += density / 3. * (X_M1 + X_P1 + X_00 - 1.);
  return pressure;
}
}  // namespace nflow::multi_component
