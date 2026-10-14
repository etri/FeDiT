// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Body force that couples the temperature field to the flow. The Boussinesq
// buoyancy -rho g beta (T - T_ref) is added to gravity and the momentum source,
// and the total force F enters the central-moment collision of the flow
// distribution through its moments of order 1, 3 and 5.

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow::conjugate_heat_transfer
{
// Boussinesq buoyancy force F_b = -rho g beta (T - T_ref).
//   density                       local fluid density rho
//   gravity                       gravitational acceleration g
//   thermal_expansion_coefficient beta
//   temperature                   local temperature T
//   reference_temperature         T_ref
NFLOW_HD inline vec3 boussinesq_force(real density,
                                      const vec3& gravity,
                                      real thermal_expansion_coefficient,
                                      real temperature,
                                      real reference_temperature)
{
  vec3 ret;
  for (int d = 0; d < 3; ++d)
  {
    ret[d] = -density * gravity[d] * thermal_expansion_coefficient
             * (temperature - reference_temperature);
  }
  return ret;
}

// Index of the central moment of order (a, b, c) in (x, y, z): a + 3 b + 9 c.
NFLOW_HD constexpr int central_moment_index(int a, int b, int c)
{
  return a + 3 * b + 9 * c;
}

// Post-collision central moments of the flow distribution that carry the
// body force F. The central moments are taken about the velocity that already
// includes the half-force shift F / (2 rho). Only the moments of order 1, 3
// and 5 written here depend on F; the remaining moments are relaxed by the
// flow collision, which is not part of these headers.
NFLOW_HD inline void set_forcing_central_moments(dist27& central, const vec3& force)
{
  central[central_moment_index(1, 0, 0)] = 0.5 * force[0];
  central[central_moment_index(0, 1, 0)] = 0.5 * force[1];
  central[central_moment_index(0, 0, 1)] = 0.5 * force[2];

  central[central_moment_index(2, 1, 0)] = 0.5 * force[1] / 3.;
  central[central_moment_index(1, 2, 0)] = 0.5 * force[0] / 3.;
  central[central_moment_index(2, 0, 1)] = 0.5 * force[2] / 3.;
  central[central_moment_index(1, 0, 2)] = 0.5 * force[0] / 3.;
  central[central_moment_index(0, 2, 1)] = 0.5 * force[2] / 3.;
  central[central_moment_index(0, 1, 2)] = 0.5 * force[1] / 3.;

  central[central_moment_index(1, 2, 2)] = 0.5 * force[0] / 9.;
  central[central_moment_index(2, 1, 2)] = 0.5 * force[1] / 9.;
  central[central_moment_index(2, 2, 1)] = 0.5 * force[2] / 9.;
}
}  // namespace nflow::conjugate_heat_transfer
