// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Collision of the temperature distribution:
// g_i* = g_i^eq + (1 - omega) g_i^neq + (1 - omega/2) w_i (3 e_i . d(Tu)/dt + s),
// with omega = 1 / tau_g, tau_g = 3 (alpha + nu_t / Pr_t) + 1/2 and
// s = q / (rho c_p). The d(Tu)/dt term corrects the first moment for the time
// change of T u.

#pragma once

#include "../common/nflow_formula.hpp"
#include "lattice.hpp"
#include "macroscopic.hpp"
#include "material.hpp"

namespace nflow::conjugate_heat_transfer
{
// Post-collision temperature distribution g*.
//   g_eq        equilibrium g^eq at the current T and u
//   g_neq       regularized non-equilibrium part g^neq (see regularization.hpp)
//   state       T and u at the current and the previous time step
//   material    thermal constants of the cell (fluid or solid)
//   heat_source volumetric heat source q, before division by rho c_p
//   turbulent_viscosity nu_t, turbulent (eddy) viscosity; 0 in laminar flow and in a solid
//   turbulent_Prandtl   Pr_t, turbulent Prandtl number
// d(Tu)/dt is taken as T u - T_prev u_prev (one time step in lattice units).
NFLOW_HD inline dist27 collision_HR(const dist27& g_eq,
                                    const dist27& g_neq,
                                    const transport_state& state,
                                    const thermal_material& material,
                                    real heat_source,
                                    real turbulent_viscosity,
                                    real turbulent_Prandtl)
{
  real omega = 1.0
               / thermal_relaxation_time(thermal_diffusivity(material), turbulent_viscosity,
                                         turbulent_Prandtl);

  real source = heat_source_term(heat_source, material.density, material.heat_capacity);

  vec3 dTUdt;
  for (int d = 0; d < 3; ++d)
  {
    dTUdt[d] = state.temperature * state.velocity[d]
               - state.temperature_previous * state.velocity_previous[d];
  }

  dist27 ret;
  for (int i = 0; i < 27; ++i)
  {
    real e_dot_dTUdt = project(i, dTUdt);

    ret[i] = g_eq[i] + (1.0 - omega) * g_neq[i]
             + (1.0 - 0.5 * omega) * weight(i) * (3.0 * e_dot_dTUdt + source);
  }

  return ret;
}
}  // namespace nflow::conjugate_heat_transfer
