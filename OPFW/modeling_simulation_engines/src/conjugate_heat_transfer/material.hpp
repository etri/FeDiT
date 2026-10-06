// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Material coefficients of the temperature equation: thermal diffusivity
// alpha = k / (rho c_p), relaxation time tau_g = 3 (alpha + nu_t / Pr_t) + 1/2
// and the heat source per heat capacity q / (rho c_p). Each cell uses the
// constants of its own material, which couples the solid and the fluid region.

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow::conjugate_heat_transfer
{
// Thermal constants of the material that occupies a cell, in lattice units.
struct thermal_material
{
  real density;        // rho
  real heat_capacity;  // specific heat capacity at constant pressure, c_p
  real conductivity;   // thermal conductivity, k
};

// Thermal diffusivity alpha = k / (rho c_p).
NFLOW_HD inline real thermal_diffusivity(real conductivity, real density, real heat_capacity)
{
  return conductivity / (density * heat_capacity);
}

// Thermal diffusivity alpha = k / (rho c_p) of a material.
NFLOW_HD inline real thermal_diffusivity(const thermal_material& m)
{
  return thermal_diffusivity(m.conductivity, m.density, m.heat_capacity);
}

// Relaxation time of the temperature distribution,
// tau_g = 3 (alpha + nu_t / Pr_t) + 1/2, with the thermal diffusivity alpha,
// the turbulent viscosity nu_t and the turbulent Prandtl number Pr_t.
// nu_t / Pr_t is the turbulent thermal diffusivity; nu_t = 0 in laminar flow
// and in a solid.
NFLOW_HD inline real thermal_relaxation_time(real diffusivity,
                                             real turbulent_viscosity,
                                             real turbulent_Prandtl)
{
  real tau = diffusivity;
  tau += (turbulent_viscosity / turbulent_Prandtl);
  tau *= 3.0;
  tau += 0.5;
  return tau;
}

// Volumetric heat source q divided by the heat capacity, s = q / (rho c_p).
NFLOW_HD inline real heat_source_term(real heat_source, real density, real heat_capacity)
{
  real s = heat_source;
  s /= (density * heat_capacity);
  return s;
}
}  // namespace nflow::conjugate_heat_transfer
