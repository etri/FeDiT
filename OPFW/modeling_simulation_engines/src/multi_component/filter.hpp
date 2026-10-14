// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Pressure filter of the two-component model. After the pressure update, the
// pressure used for the pressure force and for the next update is the
// D3Q27-weighted average of the unfiltered pressure over the node and its
// neighbours, which damps grid-scale pressure oscillations.

#pragma once

#include "../common/d3q27.hpp"
#include "../common/nflow_formula.hpp"
#include "constants.hpp"

namespace nflow::multi_component
{
// Filtered pressure p = sum_i w_i p*_i / (sum_i w_i + epsilon), where p*_i is
// the unfiltered pressure of the neighbour in direction i (i = 13 is the node
// itself) and w_i is d3q27::weight. Every existing neighbour counts, solid
// nodes included (their unfiltered pressure comes from solid_node_average).
// pressure_unfiltered: p*_i for each direction i; exists: true where the
// neighbour in direction i exists.
NFLOW_HD inline real pressure_filter(const real pressure_unfiltered[27], const bool exists[27])
{
  real filtered_pressure = 0.;
  real sum = 0.;

  for (int dir = 0; dir < 27; ++dir)
  {
    real weight = d3q27::weight(dir);

    if (exists[dir] == false)
    {
      continue;
    }

    filtered_pressure += weight * pressure_unfiltered[dir];
    sum += weight;
  }

  filtered_pressure /= (sum + epsilon);
  return filtered_pressure;
}
}  // namespace nflow::multi_component
