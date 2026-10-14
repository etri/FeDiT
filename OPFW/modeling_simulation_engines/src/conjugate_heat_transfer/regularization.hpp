// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Regularized non-equilibrium part of the temperature distribution (hybrid
// recursive regularization, first-order Hermite term only). The first moment
// of g - g^eq is blended with -c_s^2 tau_g grad T - (1/2) d(Tu)/dt by the
// weight sigma; second- and higher-order non-equilibrium moments are dropped.

#pragma once

#include "../common/nflow_formula.hpp"
#include "lattice.hpp"
#include "macroscopic.hpp"
#include "material.hpp"

namespace nflow::conjugate_heat_transfer
{
// Regularized non-equilibrium distribution g_i^neq = 3 w_i e_i . a1, where
//   a1 = sigma * sum_i (g_i - g_i^eq) e_i
//        + (1 - sigma) * (-c_s^2 tau_g grad T - (1/2) d(Tu)/dt),
// c_s^2 = 1/3 and tau_g = 3 (alpha + nu_t / Pr_t) + 1/2.
//   g                    temperature distribution after streaming
//   g_eq                 equilibrium g^eq at the current T and u
//   state                T and u at the current and the previous time step
//   temperature_gradient grad T in lattice units
//   diffusivity          thermal diffusivity alpha of the cell's material
//   sigma_HR             blending weight sigma in [0, 1]
//   turbulent_viscosity  nu_t, turbulent (eddy) viscosity; 0 in laminar flow and in a solid
//   turbulent_Prandtl    Pr_t, turbulent Prandtl number
// For a scalar advection-diffusion equation the second-order non-equilibrium
// moments are non-hydrodynamic and do not enter the macroscopic equation, so
// they are not reconstructed. This assumes isotropic conduction.
NFLOW_HD inline dist27 nonequilibrium_HR(const dist27& g,
                                         const dist27& g_eq,
                                         const transport_state& state,
                                         const vec3& temperature_gradient,
                                         real diffusivity,
                                         real sigma_HR,
                                         real turbulent_viscosity,
                                         real turbulent_Prandtl)
{
  dist27 ret;

  real a1_x = 0.;
  real a1_y = 0.;
  real a1_z = 0.;

  for (int i = 0; i < 27; ++i)
  {
    ret[i] = g[i] - g_eq[i];
  }

  for (int i = 0; i < 27; ++i)
  {
    a1_x += ret[i] * real(cx(i));
    a1_y += ret[i] * real(cy(i));
    a1_z += ret[i] * real(cz(i));

    ret[i] = 0.;
  }

  const real CSSQUARE = 1.0 / 3.0;
  real tau_g = thermal_relaxation_time(diffusivity, turbulent_viscosity, turbulent_Prandtl);

  real dCudt = state.temperature * state.velocity[0]
               - state.temperature_previous * state.velocity_previous[0];
  real dCvdt = state.temperature * state.velocity[1]
               - state.temperature_previous * state.velocity_previous[1];
  real dCwdt = state.temperature * state.velocity[2]
               - state.temperature_previous * state.velocity_previous[2];

  a1_x *= sigma_HR;
  a1_x += (1. - sigma_HR) * (-CSSQUARE * tau_g * temperature_gradient[0] - (0.5 * dCudt));
  a1_y *= sigma_HR;
  a1_y += (1. - sigma_HR) * (-CSSQUARE * tau_g * temperature_gradient[1] - (0.5 * dCvdt));
  a1_z *= sigma_HR;
  a1_z += (1. - sigma_HR) * (-CSSQUARE * tau_g * temperature_gradient[2] - (0.5 * dCwdt));

  a1_x *= 3.0;
  a1_y *= 3.0;
  a1_z *= 3.0;

  for (int i = 0; i < 27; ++i)
  {
    ret[i] += a1_x * real(cx(i));
    ret[i] += a1_y * real(cy(i));
    ret[i] += a1_z * real(cz(i));

    ret[i] *= weight(i);
  }

  return ret;
}
}  // namespace nflow::conjugate_heat_transfer
