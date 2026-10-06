// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Terms that the multiphase model adds to the central-moment collision:
// the kinematic viscosity interpolated linearly in density between the vapor
// and liquid values, and the post-collision central moments set by the force F.
// The collision kernel itself is not part of this file.

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow::multiphase
{
// Index of the central moment of order (a, b, c) in (x, y, z): a + 3 b + 9 c.
namespace central_moment
{
constexpr int m100 = 1;
constexpr int m010 = 3;
constexpr int m001 = 9;
constexpr int m210 = 5;
constexpr int m120 = 7;
constexpr int m201 = 11;
constexpr int m102 = 19;
constexpr int m021 = 15;
constexpr int m012 = 21;
constexpr int m221 = 17;
constexpr int m212 = 23;
constexpr int m122 = 25;
}  // namespace central_moment

// Kinematic viscosity at density rho, linear in density between the vapor state
// (rho_v, mu_v) and the liquid state (rho_l, mu_l):
//   nu = nu_l (rho - rho_v) / (rho_l - rho_v) + nu_v (rho_l - rho) / (rho_l - rho_v),
//   nu_v = mu_v / rho_v,  nu_l = mu_l / rho_l.
NFLOW_HD inline real mixture_kinematic_viscosity(real density,
                                                 real density_vapor,
                                                 real dynamic_viscosity_vapor,
                                                 real density_liquid,
                                                 real dynamic_viscosity_liquid)
{
  real kinematic_viscosity_vapor = dynamic_viscosity_vapor / density_vapor;
  real kinematic_viscosity_liquid = dynamic_viscosity_liquid / density_liquid;
  real kinematic_viscosity
      = kinematic_viscosity_liquid * (density - density_vapor) / (density_liquid - density_vapor)
        + kinematic_viscosity_vapor * (density_liquid - density) / (density_liquid - density_vapor);
  return kinematic_viscosity;
}

// Post-collision central moments prescribed by the force F = (F_x, F_y, F_z):
//   first order  k_100 = F_x / 2,          (and y, z alike)
//   third order  k_210 = (F_y / 2) / 3,    k_120 = (F_x / 2) / 3, ...
//   fifth order  k_122 = (F_x / 2) / 9,    k_212 = (F_y / 2) / 9, k_221 = (F_z / 2) / 9.
// The other entries of `central` are left unchanged.
NFLOW_HD inline void set_forcing_central_moments(dist27& central, const vec3& force)
{
  using namespace central_moment;

  central[m100] = 0.5 * force[0];
  central[m010] = 0.5 * force[1];
  central[m001] = 0.5 * force[2];

  central[m210] = 0.5 * force[1] / 3.;
  central[m120] = 0.5 * force[0] / 3.;
  central[m201] = 0.5 * force[2] / 3.;
  central[m102] = 0.5 * force[0] / 3.;
  central[m021] = 0.5 * force[2] / 3.;
  central[m012] = 0.5 * force[1] / 3.;

  central[m122] = 0.5 * force[0] / 9.;
  central[m212] = 0.5 * force[1] / 9.;
  central[m221] = 0.5 * force[2] / 9.;
}
}  // namespace nflow::multiphase
