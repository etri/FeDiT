// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Short-range lubrication force between a particle and its neighbours or the
// wall. For gaps between a minimum gap and h_c = 0.1 d_p the squeeze and shear
// resistances of the thin fluid film act against the normal and tangential
// relative velocity. The wall contributions are averaged over the wall spheres.

#pragma once

#include "vector_ops.hpp"

namespace nflow::fluid_dem
{
// Largest gap with a lubrication force: h_c = 0.1 d_p = 0.10 * 2 R_i.
NFLOW_HD inline real lubrication_cutoff_gap(real radius_i)
{
  constexpr real cutoff_ratio = 0.10;
  return cutoff_ratio * 2.0 * radius_i;
}

// Smallest gap with a lubrication force: max(1e-5 dx, 1e-6 R_i).
//   dx        fluid cell size
//   radius_i  particle radius R_i
NFLOW_HD inline real lubrication_min_gap(real dx, real radius_i)
{
  const real a = 1.0e-5 * dx;
  const real b = 1.0e-6 * radius_i;
  return a > b ? a : b;
}

// Lubrication force on particle i for one gap:
//   F = -a_sq v_n - a_sh (2 / (h + D))^2 v_t,
//   a_sq = 1.5 pi mu D [0.25 D / h + 0.45 L + (9/84) (h / D) L],
//   a_sh = 0.5 pi mu D L 0.25 (D + h)^2,  L = ln(max(0.5 D / h, 1e-12)).
// The caller skips gaps outside [min_gap, h_c] and applies no lubrication
// force when mu < 1e-9.
//   mu       dynamic viscosity rho nu of the fluid at the particle cell
//   mean_D   length scale D: 4 R_i R_j / (R_i + R_j) for a particle, 4 R_i for the wall
//   gap      surface gap h
//   min_gap  lubrication_min_gap
//   e        unit vector along the gap (particle: (x_j - x_i)/|x_j - x_i|, wall: wall normal)
//   v_rel    velocity of particle i relative to the partner (v_i - v_j, or v_i for the wall)
NFLOW_HD inline vec3 lubrication_force(real mu,
                                       real mean_D,
                                       real gap,
                                       real min_gap,
                                       const vec3& e,
                                       const vec3& v_rel)
{
  const real h = gap > min_gap ? gap : min_gap;

  const vec3 normal_relative_vel = dot(v_rel, e) * e;
  const vec3 tangential_relative_vel = v_rel - normal_relative_vel;

  const real log_arg_raw = 0.5 * mean_D / h;
  const real log_arg = log_arg_raw > real(1.0e-12) ? log_arg_raw : real(1.0e-12);
  const real log_term = std::log(log_arg);

  const real a_sq = 1.5 * pi * mu * mean_D
                    * ((0.25 * mean_D / h) + (0.45 * log_term)
                       + (9.0 / 84.0) * (h / mean_D) * log_term);

  const real a_sh = 0.5 * pi * mu * mean_D * log_term * 0.25 * (mean_D + h) * (mean_D + h);

  const real shear_factor = pow2(2.0 / (h + mean_D));

  return -a_sq * normal_relative_vel - a_sh * shear_factor * tangential_relative_vel;
}

// Average of the wall lubrication forces over the wall spheres within reach.
// The particle-particle lubrication forces are added after this average.
NFLOW_HD inline vec3 lubrication_wall_average(const vec3& wall_force_sum, real wall_count)
{
  if (wall_count > eps_1e12)
  {
    return wall_force_sum / wall_count;
  }
  return wall_force_sum;
}
}  // namespace nflow::fluid_dem
