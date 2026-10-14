// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Temperature conditions on walls, applied by the halfway rule on each link i
// that points into a non-conducting solid; the result is the population of the
// opposite direction. Links into a conducting solid get no condition: the
// temperature populations stream across the fluid-solid interface.

#pragma once

#include "../common/nflow_formula.hpp"
#include "lattice.hpp"

namespace nflow::conjugate_heat_transfer
{
// Isothermal wall (anti-bounce-back): g_opp(i) = -g_i* + 2 w_i T_w.
//   g_post           post-collision population g_i* leaving the cell toward the wall
//   i                direction of the link toward the wall
//   wall_temperature wall temperature T_w
NFLOW_HD inline real isothermal_wall(real g_post, int i, real wall_temperature)
{
  return -g_post + 2. * weight(i) * wall_temperature;
}

// Adiabatic wall (bounce-back): g_opp(i) = g_i*.
NFLOW_HD inline real adiabatic_wall(real g_post)
{
  return g_post;
}

// Wall heat flux divided by density and heat capacity, phi = q_w / rho / c_p.
// rho is the fluid density of the wall cell; walls that move pass rho = 1.
NFLOW_HD inline real wall_heat_flux_term(real heat_flux, real density, real heat_capacity)
{
  return heat_flux / density / heat_capacity;
}

// Convective wall heat flux q_w = -h (T - T_inf) from the heat transfer
// coefficient h, the temperature T of the wall cell and the free stream
// temperature T_inf.
NFLOW_HD inline real convective_heat_flux(real heat_transfer_coefficient,
                                          real temperature,
                                          real free_stream_temperature)
{
  return -heat_transfer_coefficient * (temperature - free_stream_temperature);
}

// Wall with a prescribed heat flux: g_opp(i) = g_i* + 6 w_i phi, with
// phi = q_w / rho / c_p from wall_heat_flux_term. Used for both the fixed heat
// flux and the convective condition.
NFLOW_HD inline real heat_flux_wall(real g_post, int i, real phi)
{
  return g_post + 6. * weight(i) * phi;
}

// Temperature at an inlet or outlet set to equilibrium when the boundary is
// adiabatic: linear extrapolation T_b = T_n + grad T_n . dx from a fluid
// neighbour n, with dx the offset from the neighbour in lattice units. The
// boundary populations are then equilibrium_HR(u_b, T_b).
NFLOW_HD inline real extrapolated_temperature(real neighbour_temperature,
                                              const vec3& neighbour_gradient,
                                              const vec3& offset)
{
  return neighbour_temperature + dot(neighbour_gradient, offset);
}
}  // namespace nflow::conjugate_heat_transfer
