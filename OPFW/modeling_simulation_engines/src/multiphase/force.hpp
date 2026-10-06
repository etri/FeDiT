// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Interaction force of the multiphase model on the D3Q27 lattice, built on the
// effective mass psi: fluid-fluid interaction with the parameters kappa and
// lambda, fluid-wall interaction with the wall strength G_w, and the body force
// from gravity and a momentum source. Also the discrete forcing term.

#pragma once

#include "../common/nflow_formula.hpp"
#include "../common/d3q27.hpp"

namespace nflow::multiphase
{
using d3q27::direction;
using d3q27::weight;

// Neighbor data along each lattice direction i = 0..26.
struct interaction_neighbors
{
  real psi[27];            // effective mass psi_i at the neighbor x + e_i
  bool wall[27];           // true where a fluid-wall interaction acts along e_i
  real wall_strength[27];  // wall strength G_w along e_i, read only where wall[i] is true
};

// Fluid-fluid and fluid-wall interaction force at a fluid node with effective mass psi:
//   F = sum_i W_i e_i [ -G_w psi^2 (wall directions only)
//                       + (lambda/2 - kappa/6) psi_i^2 + (1 - lambda + kappa/3) psi psi_i ]
//       + (kappa/6) L G,
//   L = sum_i 2 W_i (psi_i - psi),   G = sum_i W_i psi_i e_i,   W_i = 3 w_i.
// The sums run over i = 0..26 in that order.
NFLOW_HD inline vec3 interaction_force_4th_order(real psi,
                                                 const interaction_neighbors& neighbors,
                                                 real kappa,
                                                 real lambda)
{
  vec3 force;
  vec3 psi_gradient;
  for (int k = 0; k < 3; ++k)
  {
    force[k] = 0.;
    psi_gradient[k] = 0.;
  }
  real psi_laplacian = 0.;

  for (int dir = 0; dir < 27; ++dir)
  {
    real w = weight(dir);
    w *= 3.;
    const vec3 e = direction(dir);

    if (neighbors.wall[dir])
    {
      real gw = neighbors.wall_strength[dir];
      for (int k = 0; k < 3; ++k)
      {
        force[k] += -psi * gw * w * psi * e[k];
      }
    }

    real psi_moved = neighbors.psi[dir];

    for (int k = 0; k < 3; ++k)
    {
      force[k] += (lambda / 2. - kappa / 6.) * w * psi_moved * psi_moved * e[k];
    }
    for (int k = 0; k < 3; ++k)
    {
      force[k] += (1. - lambda + kappa / 3.) * psi * w * psi_moved * e[k];
    }

    psi_laplacian += 2. * w * (psi_moved - psi);
    for (int k = 0; k < 3; ++k)
    {
      psi_gradient[k] += w * psi_moved * e[k];
    }
  }

  for (int k = 0; k < 3; ++k)
  {
    force[k] += kappa / 6. * psi_laplacian * psi_gradient[k];
  }
  return force;
}

// Adds the body force to F: F += g (rho - rho_ref) + S, with gravity g, density rho,
// reference density rho_ref and momentum source S.
NFLOW_HD inline void add_body_force(vec3& force,
                                    const vec3& gravity,
                                    real density,
                                    real density_ref,
                                    const vec3& momentum_source)
{
  for (int k = 0; k < 3; ++k)
  {
    force[k] += gravity[k] * (density - density_ref) + momentum_source[k];
  }
}

// Discrete forcing term for direction i with force F at velocity u:
//   F_i = w_i F . [3 (e_i - u) + 9 (e_i . u) e_i].
NFLOW_HD inline real forcing_term(int i, const vec3& force, const vec3& velocity)
{
  const vec3 e = direction(i);
  real e_dot_u = dot(e, velocity);

  vec3 c;
  for (int k = 0; k < 3; ++k)
  {
    c[k] = 3.0 * (e[k] - velocity[k]) + 9.0 * e_dot_u * e[k];
  }
  return weight(i) * dot(force, c);
}
}  // namespace nflow::multiphase
