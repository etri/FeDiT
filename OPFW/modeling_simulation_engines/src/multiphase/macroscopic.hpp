// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Density and velocity from the D3Q27 distribution with the half-force
// correction of the velocity: rho = sum_i f_i, u = (sum_i f_i e_i + F / 2) / rho.
// Two forms are kept because they round differently: one for fluid nodes and
// one for the interior nodes read by the boundary formulas.

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow::multiphase
{
// Partial sums of the distribution over the planes c_x = -1, 0, +1, c_y = -1, +1 and c_z = -1, +1.
struct directional_sums
{
  real x_minus;
  real x_zero;
  real x_plus;
  real y_minus;
  real y_plus;
  real z_minus;
  real z_plus;
};

// Density and velocity of a node.
struct density_velocity
{
  real density;
  vec3 velocity;
};

// Partial sums of f over the lattice planes, each summed in increasing direction index.
NFLOW_HD inline directional_sums sum_by_direction(const dist27& f)
{
  directional_sums s;
  s.x_minus = f[0] + f[3] + f[6] + f[9] + f[12] + f[15] + f[18] + f[21] + f[24];
  s.x_plus = f[2] + f[5] + f[8] + f[11] + f[14] + f[17] + f[20] + f[23] + f[26];
  s.x_zero = f[1] + f[4] + f[7] + f[10] + f[13] + f[16] + f[19] + f[22] + f[25];

  s.y_minus = f[0] + f[1] + f[2] + f[9] + f[10] + f[11] + f[18] + f[19] + f[20];
  s.y_plus = f[6] + f[7] + f[8] + f[15] + f[16] + f[17] + f[24] + f[25] + f[26];

  s.z_minus = f[0] + f[1] + f[2] + f[3] + f[4] + f[5] + f[6] + f[7] + f[8];
  s.z_plus = f[18] + f[19] + f[20] + f[21] + f[22] + f[23] + f[24] + f[25] + f[26];
  return s;
}

// Density and velocity at a fluid node: rho = sum f, u = (sum f e) / rho + (F / 2) / rho.
NFLOW_HD inline density_velocity density_and_velocity(const dist27& f, const vec3& force)
{
  directional_sums s = sum_by_direction(f);

  density_velocity r;
  r.density = s.x_minus + s.x_plus + s.x_zero;
  r.velocity[0] = (s.x_plus - s.x_minus) / r.density;
  r.velocity[1] = (s.y_plus - s.y_minus) / r.density;
  r.velocity[2] = (s.z_plus - s.z_minus) / r.density;

  for (int k = 0; k < 3; ++k)
  {
    r.velocity[k] += 0.5 * force[k] / r.density;
  }
  return r;
}

// Density and velocity of an interior node read by the boundary formulas:
// rho = sum f, u = (sum f e + F / 2) / rho.
NFLOW_HD inline density_velocity neighbor_density_and_velocity(const dist27& f, const vec3& force)
{
  directional_sums s = sum_by_direction(f);

  density_velocity r;
  r.density = s.x_minus + s.x_plus + s.x_zero;
  r.velocity[0] = (s.x_plus - s.x_minus + 0.5 * force[0]) / r.density;
  r.velocity[1] = (s.y_plus - s.y_minus + 0.5 * force[1]) / r.density;
  r.velocity[2] = (s.z_plus - s.z_minus + 0.5 * force[2]) / r.density;
  return r;
}
}  // namespace nflow::multiphase
