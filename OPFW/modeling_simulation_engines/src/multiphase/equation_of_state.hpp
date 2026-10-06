// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Peng-Robinson equation of state in lattice units and the effective mass psi
// on which the interaction force is built:
//   p   = rho T / (1 - b rho) - a alpha rho^2 / (1 + 2 b rho - b^2 rho^2),
//   psi = sqrt(-2 (p - rho / 3)).

#pragma once

#include <cmath>

#include "../common/nflow_formula.hpp"

namespace nflow::multiphase
{
// Parameters of the Peng-Robinson equation of state.
struct peng_robinson_params
{
  real critical_temperature;   // T_c in physical units
  real saturated_temperature;  // T_s in physical units; the reduced temperature is T_s / T_c
  real a;                      // attraction parameter a in lattice units
  real b;                      // co-volume parameter b in lattice units
};

// x^2.
template <typename T>
NFLOW_HD inline T power2(T x)
{
  return x * x;
}

// Peng-Robinson pressure p at density rho and the saturated temperature.
// The temperature in lattice units is T = (T_s / T_c) T_c,lb with T_c,lb = a / b / 5.87712, and
// alpha = (1 + eta (1 - sqrt(T_s / T_c)))^2 with eta = 0.37464 + 1.54226 w - 0.26992 w^2
// for the acentric factor w = 0.344.
NFLOW_HD inline real peng_robinson_pressure(real density, const peng_robinson_params& params)
{
  real reduced_temperature = params.saturated_temperature / params.critical_temperature;

  real a = params.a;
  real b = params.b;
  real acentric_factor = 0.344;
  real eta = 0.37464 + 1.54226 * acentric_factor - 0.26992 * acentric_factor * acentric_factor;

  real critical_temperature_lb = a / b / 5.87712;
  real temperature = reduced_temperature * critical_temperature_lb;

  real epsilon = power2(1. + eta * (1. - sqrt(reduced_temperature)));

  real pressure = density * temperature / (1. - b * density)
                  - a * density * density * epsilon / (1. + 2. * b * density - b * b * density * density);
  return pressure;
}

// Effective mass psi = sqrt(-2 (p - rho / 3)) from the density rho and the pressure p
// given by the equation of state. It is evaluated at fluid and solid nodes.
NFLOW_HD inline real effective_mass(real density, real pressure)
{
  real psi = sqrt(-2. * (pressure - density / 3.));
  return psi;
}
}  // namespace nflow::multiphase
