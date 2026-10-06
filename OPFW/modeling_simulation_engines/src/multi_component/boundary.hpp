// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Wall treatment of the order parameter. A solid node takes the
// weight-averaged values of its fluid neighbours, and the order parameter at
// the wall is then corrected for a prescribed static contact angle (wetting
// condition) using the equilibrium tanh profile of the interface.

#pragma once

#include <cmath>

#include "../common/d3q27.hpp"
#include "../common/nflow_formula.hpp"
#include "constants.hpp"

namespace nflow::multi_component
{
// Weighted average over the fluid neighbours of a solid node,
// q_ref = sum_i w_i q_i / sum_i w_i over the directions i whose neighbour is
// fluid, with the D3Q27 weights w_i of d3q27::weight. The solver applies it to
// the order parameter and to the pressure.
// values: q of the neighbour in each direction i; is_fluid: true where the
// neighbour exists and is fluid (entry 13 is the node itself and is false).
NFLOW_HD inline real solid_node_average(const real values[27], const bool is_fluid[27])
{
  real sum = 0.;
  real value_ref = 0.;

  for (int dir = 0; dir < 27; ++dir)
  {
    if (is_fluid[dir] == false)
    {
      continue;
    }

    real weight = d3q27::weight(dir);
    sum += weight;

    value_ref += values[dir] * weight;
  }

  value_ref /= sum;
  return value_ref;
}

// Order parameter at distance d from a wall with static contact angle theta,
// from the tanh interface profile:
//   a = d (-4 / W) cos(theta),
//   phi = (1 + a - sqrt(|(1 + a)^2 - 4 a phi_ref|)) / a - phi_ref,
// and phi = phi_ref when theta is 90 degrees.
// order_parameter_ref: phi_ref, the fluid-side value; contact_angle_deg: theta
// in degrees; wall_distance: d in lattice units; interface_width: W in lattice
// units of the local grid.
NFLOW_HD inline real wetting_order_parameter(real order_parameter_ref,
                                             real contact_angle_deg,
                                             real wall_distance,
                                             real interface_width)
{
  real angle = contact_angle_deg;
  angle *= pi / 180.;

  real a = wall_distance * (-4. / interface_width * cos(angle));

  real order_parameter = 0.;

  if (fabs(angle - 0.5 * pi) < epsilon)
    order_parameter = order_parameter_ref;
  else
    order_parameter
        = 1.0 / a * (1.0 + a - sqrt(fabs((1.0 + a) * (1.0 + a) - 4.0 * a * order_parameter_ref)))
          - order_parameter_ref;

  return order_parameter;
}
}  // namespace nflow::multi_component
