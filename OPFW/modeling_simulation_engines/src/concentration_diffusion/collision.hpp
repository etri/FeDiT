// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Collision step of the concentration distribution g_i.
// The post-collision value is g_i^eq + (1 - omega) g_i^neq plus a forcing term that carries
// the change of the advective flux C u over one time step and the volumetric source S.
// The relaxation rate omega = 1 / (3 D_eff + 1/2) sets the effective diffusivity
// D_eff = D (+ optional sensor-gated term) + nu_t / Sc_t.

#pragma once

#include "../common/nflow_formula.hpp"
#include "../common/d3q27.hpp"

namespace nflow
{
namespace concentration_diffusion
{
using d3q27::direction;
using d3q27::weight;

// Diffusivity with an optional sensor-gated artificial diffusion,
//   D + D_art * s,  s = |grad C|^2 / (|grad C|^2 + K^2),  0 <= s <= 1.
// The term is added only when D_art > 0. s is close to 1 where |grad C| >> K and close
// to 0 where |grad C| << K, so the extra diffusion is confined to steep fronts.
// diffusivity: molecular diffusivity D, artificial_diffusivity: D_art,
// sensor_threshold: K, concentration_gradient: grad C (all in lattice units).
NFLOW_HD inline real sensor_gated_diffusivity(real diffusivity,
                                              real artificial_diffusivity,
                                              real sensor_threshold,
                                              vec3 const& concentration_gradient)
{
  real D = diffusivity;
  if (artificial_diffusivity > 0.0)
  {
    real K = sensor_threshold;
    vec3 cgrad = concentration_gradient;
    real g2 = dot(cgrad, cgrad);
    real sensor = g2 / (g2 + K * K);
    D += artificial_diffusivity * sensor;
  }
  return D;
}

// Relaxation rate of the collision step, omega = 1 / tau with
//   tau = 3 (D_s + nu_t / Sc_t) + 1/2  (c_s^2 = 1/3, lattice units).
// diffusivity: D_s, the value of sensor_gated_diffusivity (equal to D when D_art = 0),
// turbulent_viscosity: nu_t, the turbulent (eddy) viscosity (0 without a turbulence model),
// turbulent_Schmidt: Sc_t, the turbulent Schmidt number.
NFLOW_HD inline real relaxation_rate(real diffusivity,
                                     real turbulent_viscosity,
                                     real turbulent_Schmidt)
{
  real omega = diffusivity;
  omega += (turbulent_viscosity / turbulent_Schmidt);
  omega *= 3.0;
  omega += 0.5;
  omega = 1.0 / omega;
  return omega;
}

// Post-collision concentration distribution
//   g_i* = g_i^eq + (1 - omega) g_i^neq + (1 - omega/2) w_i (3 e_i . d(Cu) + S),
//   d(Cu) = C u - C_prev u_prev  (change of the advective flux over one time step).
// g_eq: equilibrium from equilibrium_HR, g_neq: regularized non-equilibrium part from
// nonequilibrium_HR, omega: relaxation rate, concentration / concentration_previous: C at the
// current / previous step, velocity / velocity_previous: u at the current / previous step,
// concentration_source: source term S per time step (lattice units).
NFLOW_HD inline dist27 collision_HR(dist27 const& g_eq,
                                    dist27 const& g_neq,
                                    real omega,
                                    real concentration,
                                    real concentration_previous,
                                    vec3 const& velocity,
                                    vec3 const& velocity_previous,
                                    real concentration_source)
{
  dist27 g_temp = g_eq;

  vec3 DCUDT;
  for (int k = 0; k < 3; ++k)
  {
    DCUDT[k] = concentration * velocity[k] - concentration_previous * velocity_previous[k];
  }

  for (int nDir = 0; nDir < 27; nDir++)
  {
    vec3 direct = direction(nDir);
    real e_dot_DCUDT = dot(direct, DCUDT);

    g_temp[nDir] = g_temp[nDir] + (1.0 - omega) * g_neq[nDir]
                   + (1.0 - 0.5 * omega) * weight(nDir)
                         * (3.0 * e_dot_DCUDT + concentration_source);
  }

  return g_temp;
}

}  // namespace concentration_diffusion
}  // namespace nflow
