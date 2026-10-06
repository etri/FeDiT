// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Regularized non-equilibrium part of the concentration distribution g_i.
// The first-order non-equilibrium moment is a blend, weighted by sigma_HR, of the moment
// projected from g - g^eq and the moment rebuilt from the concentration gradient. Only this
// first-order Hermite term is reconstructed; higher-order non-equilibrium moments are dropped.

#pragma once

#include "../common/nflow_formula.hpp"
#include "../common/d3q27.hpp"

namespace nflow
{
namespace concentration_diffusion
{
using d3q27::direction;
using d3q27::weight;

// Regularized non-equilibrium distribution
//   a1     = sigma_HR * sum_i e_i (g_i - g_i^eq)
//            + (1 - sigma_HR) * (-c_s^2 tau grad C - d(Cu) / 2),
//   g_i^neq = w_i (a1 . e_i) / c_s^2,
// with tau = 3 (D + nu_t / Sc_t) + 1/2, c_s^2 = 1/3 and d(Cu) = C u - C_prev u_prev.
// conc / conc_prev: C at the current / previous step, conc_grad: grad C,
// diffu: molecular diffusivity D (the sensor-gated term of collision.hpp is not added here),
// g: distribution after streaming and boundary treatment,
// g_eq: equilibrium from equilibrium_HR, vel / vel_prev: u at the current / previous step,
// turbulent_viscosity: nu_t, the turbulent (eddy) viscosity (0 without a turbulence model),
// turbulent_Schmidt: Sc_t, the turbulent Schmidt number,
// sigma_HR: blending weight (1 uses only the projected moment).
NFLOW_HD inline dist27 nonequilibrium_HR(real conc,
                                         real conc_prev,
                                         vec3 const& conc_grad,
                                         real diffu,
                                         dist27 const& g,
                                         dist27 const& g_eq,
                                         vec3 const& vel,
                                         vec3 const& vel_prev,
                                         real turbulent_viscosity,
                                         real turbulent_Schmidt,
                                         real sigma_HR)
{
  dist27 ret;

  real A1neq_0 = 0.;
  real A1neq_1 = 0.;
  real A1neq_2 = 0.;

  for (int nDir = 0; nDir < 27; nDir++)
  {
    ret[nDir] = g[nDir] - g_eq[nDir];
  }

  for (int nDir = 0; nDir < 27; nDir++)
  {
    vec3 direct = direction(nDir);

    A1neq_0 += ret[nDir] * direct[0];
    A1neq_1 += ret[nDir] * direct[1];
    A1neq_2 += ret[nDir] * direct[2];

    ret[nDir] = 0.;
  }

  const real CSSQUARE = 1.0 / 3.0;
  real tau_g = diffu;
  tau_g += (turbulent_viscosity / turbulent_Schmidt);
  tau_g *= 3.0;
  tau_g += 0.5;

  real dCudt = conc * vel[0] - conc_prev * vel_prev[0];
  real dCvdt = conc * vel[1] - conc_prev * vel_prev[1];
  real dCwdt = conc * vel[2] - conc_prev * vel_prev[2];

  A1neq_0 *= sigma_HR;
  A1neq_0 += (1. - sigma_HR) * (-CSSQUARE * tau_g * conc_grad[0] - (0.5 * dCudt));
  A1neq_1 *= sigma_HR;
  A1neq_1 += (1. - sigma_HR) * (-CSSQUARE * tau_g * conc_grad[1] - (0.5 * dCvdt));
  A1neq_2 *= sigma_HR;
  A1neq_2 += (1. - sigma_HR) * (-CSSQUARE * tau_g * conc_grad[2] - (0.5 * dCwdt));

  A1neq_0 *= 3.0;
  A1neq_1 *= 3.0;
  A1neq_2 *= 3.0;

  for (int nDir = 0; nDir < 27; nDir++)
  {
    vec3 direct = direction(nDir);

    ret[nDir] += A1neq_0 * direct[0];
    ret[nDir] += A1neq_1 * direct[1];
    ret[nDir] += A1neq_2 * direct[2];

    ret[nDir] *= weight(nDir);
  }

  return ret;
}

}  // namespace concentration_diffusion
}  // namespace nflow
