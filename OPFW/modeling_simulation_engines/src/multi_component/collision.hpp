// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Collision terms of the two populations, written in central-moment space.
// For F (flow) only the relaxation rate and the forcing terms are given; the
// other flow moments follow the cumulant collision of the flow solver. For G
// (order parameter) the full set of post-collision central moments of the
// conservative Allen-Cahn equation is given.

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow::multi_component
{
// Position of the central moment k_abc (orders a, b, c in x, y, z) inside a
// dist27: index = a + 3 b + 9 c.
namespace moment
{
constexpr int m000 = 0;
constexpr int m100 = 1;
constexpr int m010 = 3;
constexpr int m001 = 9;
constexpr int m200 = 2;
constexpr int m020 = 6;
constexpr int m002 = 18;
constexpr int m110 = 4;
constexpr int m101 = 10;
constexpr int m011 = 12;
constexpr int m111 = 13;
constexpr int m210 = 5;
constexpr int m120 = 7;
constexpr int m201 = 11;
constexpr int m102 = 19;
constexpr int m021 = 15;
constexpr int m012 = 21;
constexpr int m211 = 14;
constexpr int m121 = 16;
constexpr int m112 = 22;
constexpr int m220 = 8;
constexpr int m202 = 20;
constexpr int m022 = 24;
constexpr int m221 = 17;
constexpr int m212 = 23;
constexpr int m122 = 25;
constexpr int m222 = 26;
}  // namespace moment

// Shear relaxation rate of F: omega = 1 / (3 nu + 1/2).
// kinematic_viscosity: nu = mu / rho + nu_t in lattice units.
NFLOW_HD inline real flow_relaxation_rate(real kinematic_viscosity)
{
  real omega = 3. * kinematic_viscosity + 0.5;
  omega = 1. / omega;
  return omega;
}

// Forcing terms of the F collision. With a = force / density and the
// first-order rate omega_1 = 1:
//   k_100 <- (1 - omega_1) k_100 + (1 - omega_1 / 2) a_x   (same for y, z),
//   k_210 = k_012 = a_y / 6,  k_120 = k_102 = a_x / 6,  k_201 = k_021 = a_z / 6,
//   k_122 = a_x / 18,  k_212 = a_y / 18,  k_221 = a_z / 18.
// central_moments: central moments of F (indices in namespace moment), updated
// in place; force: total force per unit volume; density: local density rho.
NFLOW_HD inline void collision_F_forcing(dist27& central_moments, const vec3& force, real density)
{
  dist27& k = central_moments;

  vec3 acceleration;
  acceleration[0] = force[0] / density;
  acceleration[1] = force[1] / density;
  acceleration[2] = force[2] / density;

  real omega1 = 1.;

  k[moment::m100] = (1.0 - omega1) * k[moment::m100] + (1. - 0.5 * omega1) * acceleration[0];
  k[moment::m010] = (1.0 - omega1) * k[moment::m010] + (1. - 0.5 * omega1) * acceleration[1];
  k[moment::m001] = (1.0 - omega1) * k[moment::m001] + (1. - 0.5 * omega1) * acceleration[2];

  k[moment::m210] = 0.5 * acceleration[1] / 3.;
  k[moment::m120] = 0.5 * acceleration[0] / 3.;
  k[moment::m201] = 0.5 * acceleration[2] / 3.;
  k[moment::m102] = 0.5 * acceleration[0] / 3.;
  k[moment::m021] = 0.5 * acceleration[2] / 3.;
  k[moment::m012] = 0.5 * acceleration[1] / 3.;

  k[moment::m122] = 0.5 * acceleration[0] / 9.;
  k[moment::m212] = 0.5 * acceleration[1] / 9.;
  k[moment::m221] = 0.5 * acceleration[2] / 9.;
}

// Relaxation rate of G: omega_g = 1 / (3 M + 1/2).
// mobility: M in lattice units of the local grid.
NFLOW_HD inline real phase_field_relaxation_rate(real mobility)
{
  real omega = 3. * mobility + 0.5;
  omega = 1. / omega;
  return omega;
}

// Post-collision central moments of G for the conservative Allen-Cahn
// equation. The first-order moments relax towards phi u with rate omega_g and
// receive the interface force F_phi; every other moment is set directly:
//   k_000 = phi + S/2,
//   k_100 = (1 - omega_g)(r_100 - phi u_x) + (1 - omega_g / 2) F_phi,x  (y, z alike),
//   k_200 = k_020 = k_002 = (phi + S/2) / 3,
//   k_220 = k_202 = k_022 = (phi + S/2) / 9,  k_222 = (phi + S/2) / 27,
//   k_210 = k_012 = F_phi,y / 6,  k_120 = k_102 = F_phi,x / 6,  k_201 = k_021 = F_phi,z / 6,
//   k_122 = F_phi,x / 18,  k_212 = F_phi,y / 18,  k_221 = F_phi,z / 18,
//   k_110 = k_101 = k_011 = k_111 = k_211 = k_121 = k_112 = 0.
// r_100, r_010, r_001 are the raw first moments of the pre-collision g.
// g: pre-collision distribution of G; velocity: u; order_parameter: phi;
// force_phi: interface force F_phi of the phi equation; source: S, source of
// phi per time step; mobility: M in lattice units of the local grid.
// Returns the post-collision central moments (indices in namespace moment).
NFLOW_HD inline dist27 collision_G_moments(const dist27& g,
                                           const vec3& velocity,
                                           real order_parameter,
                                           const vec3& force_phi,
                                           real source,
                                           real mobility)
{
  // r100
  real val1 = g[2] + g[5] + g[8] + g[11] + g[14] + g[17] + g[20] + g[23] + g[26]
              - (g[0] + g[3] + g[6] + g[9] + g[12] + g[15] + g[18] + g[21] + g[24]);
  // r010
  real val2 = g[6] + g[7] + g[8] + g[15] + g[16] + g[17] + g[24] + g[25] + g[26]
              - (g[0] + g[1] + g[2] + g[9] + g[10] + g[11] + g[18] + g[19] + g[20]);
  // r001
  real val3 = g[18] + g[19] + g[20] + g[21] + g[22] + g[23] + g[24] + g[25] + g[26]
              - (g[0] + g[1] + g[2] + g[3] + g[4] + g[5] + g[6] + g[7] + g[8]);

  dist27 k = {};

  real omega = phase_field_relaxation_rate(mobility);

  k[moment::m000] = order_parameter + 0.5 * source;

  k[moment::m100]
      = (1. - omega) * (val1 - order_parameter * velocity[0]) + (1. - 0.5 * omega) * force_phi[0];
  k[moment::m010]
      = (1. - omega) * (val2 - order_parameter * velocity[1]) + (1. - 0.5 * omega) * force_phi[1];
  k[moment::m001]
      = (1. - omega) * (val3 - order_parameter * velocity[2]) + (1. - 0.5 * omega) * force_phi[2];

  k[moment::m110] = 0.;
  k[moment::m101] = 0.;
  k[moment::m011] = 0.;

  k[moment::m200] = order_parameter / 3. + 0.5 * source / 3.;
  k[moment::m020] = order_parameter / 3. + 0.5 * source / 3.;
  k[moment::m002] = order_parameter / 3. + 0.5 * source / 3.;

  k[moment::m210] = force_phi[1] / 6.;
  k[moment::m120] = force_phi[0] / 6.;
  k[moment::m201] = force_phi[2] / 6.;
  k[moment::m102] = force_phi[0] / 6.;
  k[moment::m021] = force_phi[2] / 6.;
  k[moment::m012] = force_phi[1] / 6.;

  k[moment::m111] = 0.;

  k[moment::m211] = 0.;
  k[moment::m121] = 0.;
  k[moment::m112] = 0.;

  k[moment::m220] = order_parameter / 9. + 0.5 * source / 9.;
  k[moment::m202] = order_parameter / 9. + 0.5 * source / 9.;
  k[moment::m022] = order_parameter / 9. + 0.5 * source / 9.;

  k[moment::m122] = force_phi[0] / 18.;
  k[moment::m212] = force_phi[1] / 18.;
  k[moment::m221] = force_phi[2] / 18.;

  k[moment::m222] = order_parameter / 27. + 0.5 * source / 27.;

  return k;
}
}  // namespace nflow::multi_component
