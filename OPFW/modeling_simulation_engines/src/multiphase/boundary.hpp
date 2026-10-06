// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Convective outflow boundary of the multiphase model. Distributions and force
// at the outlet follow d(phi)/dt + U d(phi)/dn = 0, implicit in time with a
// third-order one-sided difference in space, where U is the mean outflow speed.
// A switch can instead rebuild the outlet distributions on the vapor side.

#pragma once

#include "../common/nflow_formula.hpp"
#include "force.hpp"
#include "macroscopic.hpp"

namespace nflow::multiphase
{
// |x| evaluated as (x > 0 ? x : -x).
NFLOW_HD inline real abs_value(real x)
{
  return x > 0 ? x : -x;
}

// Outflow speed sample at an outlet node on a geometry surface.
// u is the velocity of the second node inward from the outlet node (see
// neighbor_density_and_velocity), n is the unit inward normal, and (nx, ny)
// are the x and y components of n truncated to integers; they select the axis.
// The outflow speed U is the sum of all samples divided by the number of outlet nodes.
NFLOW_HD inline real convective_speed_surface(const vec3& velocity, const vec3& inward_normal, int nx, int ny)
{
  real axial_velocity = 0.0;
  if (nx != 0)
  {
    axial_velocity = abs_value(velocity[0]) * -inward_normal[0];
  }
  else if (ny != 0)
  {
    axial_velocity = abs_value(velocity[1]) * -inward_normal[1];
  }
  else
  {
    // The z case multiplies by the y component of the normal, as implemented in the solver.
    axial_velocity = abs_value(velocity[2]) * -inward_normal[1];
  }
  return axial_velocity;
}

// Outflow speed sample at an outlet node on a face of the computational domain: |u_n|.
// u is the velocity of the second node inward from the outlet node and (nx, ny) are the
// x and y components of the integer face normal; they select the axis.
NFLOW_HD inline real convective_speed_domain_face(const vec3& velocity, int nx, int ny)
{
  real axial_velocity = 0.0;
  if (nx != 0)
  {
    axial_velocity = abs_value(velocity[0]);
  }
  else if (ny != 0)
  {
    axial_velocity = abs_value(velocity[1]);
  }
  else
  {
    axial_velocity = abs_value(velocity[2]);
  }
  return axial_velocity;
}

// Convective extrapolation of an outlet quantity phi (distributions or force) with outflow speed U:
//   phi_b <- (phi_b + 3 U phi_0 - 1.5 U phi_1 + (U / 3) phi_2) / (1 + 11 U / 6),
// where phi_0, phi_1, phi_2 are the values at the next three nodes inward from the node b.
// It is applied first to the first interior node (with the three nodes behind it) and then
// to the outlet node (with the updated first interior node).
template <int N>
NFLOW_HD inline real_array<N> convective_extrapolation(const real_array<N>& phi_b,
                                                       const real_array<N>& phi_0,
                                                       const real_array<N>& phi_1,
                                                       const real_array<N>& phi_2,
                                                       real u)
{
  real_array<N> r;
  for (int k = 0; k < N; ++k)
  {
    r[k] = (phi_b[k] + 3. * u * phi_0[k] - 1.5 * u * phi_1[k] + 1. / 3. * u * phi_2[k])
           / (1. + 11. / 6. * u);
  }
  return r;
}

// Switch of the outlet treatment: the convective extrapolation is used when
//   rho > rho_v + c (rho_l - rho_v),  c = -9999999999999,
// that is, whenever the liquid density rho_l clearly exceeds the vapor density rho_v.
// rho is the density of the second interior node: from its distributions for the
// distribution update and its stored density for the force update.
NFLOW_HD inline bool use_convective_extrapolation(real density, real density_liquid, real density_vapor)
{
  real criterion = -9999999999999.;
  return density > (density_vapor + criterion * (density_liquid - density_vapor));
}

// Outlet distributions when the extrapolation is not selected:
//   f_b = feq_vapor - F_i / 2 + (f_1 - feq_inner),
// where f_1 and F_1 are the distributions and force of the second interior node, u_1 is its
// velocity (see neighbor_density_and_velocity) and F_i is the forcing term with F_1 at u_1.
// The equilibrium values are given by the caller: feq_vapor at (u_1, rho_v) with the vapor
// density rho_v, and feq_inner at (u_1, rho_1) with the density rho_1 of that node.
// The first interior node and the outlet node both take f_b, and both take F_1 as their force.
NFLOW_HD inline dist27 vapor_outflow_distribution(const dist27& f_1,
                                                  const vec3& force_1,
                                                  const dist27& feq_vapor,
                                                  const dist27& feq_inner)
{
  density_velocity inner = neighbor_density_and_velocity(f_1, force_1);
  vec3 inner_velocity = inner.velocity;

  dist27 feq = feq_vapor;
  dist27 ff;
  for (int i = 0; i < 27; ++i)
  {
    ff[i] = forcing_term(i, force_1, inner_velocity);
  }

  const dist27& feq_minus1 = feq_inner;
  dist27 fneq_minus1;
  for (int i = 0; i < 27; ++i)
  {
    fneq_minus1[i] = f_1[i] - feq_minus1[i];
  }

  for (int i = 0; i < 27; ++i)
  {
    feq[i] = feq[i] - 0.5 * ff[i] + fneq_minus1[i];
  }
  return feq;
}
}  // namespace nflow::multiphase
