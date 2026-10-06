// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Boundary conditions for the concentration distribution g_i.
// Equilibrium boundaries reset g at a boundary cell to g^eq(u_b, C_b); C_b is a prescribed
// value at inlets and is taken from the interior at outlets and outflow boundaries.
// Walls reflect g by halfway bounce-back, which allows no concentration flux through the wall.

#pragma once

#include "../common/nflow_formula.hpp"
#include "../common/d3q27.hpp"
#include "equilibrium.hpp"

namespace nflow
{
namespace concentration_diffusion
{
using d3q27::opposite;

// Equilibrium boundary: g_i = g_i^eq(u_b, C_b) for all i.
// velocity: boundary velocity u_b, concentration: boundary concentration C_b (lattice units).
// At an inlet C_b is the prescribed value; at outlets it comes from one of the functions below.
NFLOW_HD inline dist27 equilibrium_boundary(vec3 const& velocity, real concentration)
{
  return equilibrium_HR(velocity, concentration);
}

// Boundary concentration extrapolated from an interior neighbour n,
//   C_b = C_n + grad C_n . d,
// where d is the offset, in lattice units, from the centre of n to the point one lattice
// spacing away from the boundary cell centre along its wall normal.
// Used by outlet and outflow boundaries on surfaces inside the domain.
NFLOW_HD inline real extrapolated_concentration(real neighbor_concentration,
                                                vec3 const& neighbor_gradient,
                                                vec3 const& offset)
{
  return neighbor_concentration + dot(neighbor_gradient, offset);
}

// Zero-gradient boundary concentration on a domain face: C_b = C_n, the value of the interior
// neighbour along the face normal, or the boundary cell's own value when that neighbour is solid.
// Used by outlet boundaries on the faces of the domain.
NFLOW_HD inline real zero_gradient_concentration(real neighbor_concentration,
                                                 real own_concentration,
                                                 bool neighbor_is_solid)
{
  real concentration = neighbor_concentration;
  if (neighbor_is_solid)
  {
    concentration = own_concentration;
  }
  return concentration;
}

// Halfway bounce-back: for every link i that points into a wall, g_opp(i) = g_i*, where g* is
// the post-collision distribution of the boundary cell. No correction term is added to g, also
// on moving walls. wall_link[i] is true when the neighbour in direction e_i is solid or absent.
NFLOW_HD inline void halfway_bounce_back(dist27& g,
                                         dist27 const& g_post_collision,
                                         bool const (&wall_link)[27])
{
  for (int dir = 0; dir < 27; ++dir)
  {
    if (wall_link[dir])
    {
      g[opposite(dir)] = g_post_collision[dir];
    }
  }
}

}  // namespace concentration_diffusion
}  // namespace nflow
