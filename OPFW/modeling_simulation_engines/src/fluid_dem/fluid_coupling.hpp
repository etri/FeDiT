// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Fluid force on a particle and its reaction on the fluid. Stokes drag with the
// correction factor 1 + 0.15 Re^0.687, a coarse-grain drag correction k^2, a
// limit on the drag impulse of one sub-step, and the pressure gradient force.
// The reaction of the drag and pressure gradient force is spread to the fluid cells.

#pragma once

#include "vector_ops.hpp"

namespace nflow::fluid_dem
{
// Volume of a sphere used by the fluid coupling: V = ((4/3) pi) R^3.
constexpr real sphere_volume_coefficient = (4.0 / 3.0) * pi;

NFLOW_HD inline real sphere_volume(real radius)
{
  return sphere_volume_coefficient * pow3(radius);
}

// Reference dynamic viscosity of water [Pa s] used by particle_reynolds_reference.
constexpr real reference_water_dynamic_viscosity = 0.001;

// Particle Reynolds number with the reference water viscosity (input option
// particle_reynolds_viscosity = "legacy", the default):
//   Re = [rho_f (2 R) |u_f - v_p| / mu_f] / (mu_ref k / mu_f),
// which equals rho_f (2 R / k) |u_f - v_p| / mu_ref with mu_ref = 0.001 Pa s.
// Re = 0 when mu_f <= 1e-9.
//   fluid_density            rho_f at the particle position
//   radius                   particle radius R
//   relative_speed           |u_f - v_p|
//   fluid_dynamic_viscosity  mu_f = rho_f nu_f at the particle position
//   radius_scaling_factor    k = R / R_real (1 without coarse graining)
NFLOW_HD inline real particle_reynolds_reference(real fluid_density,
                                                 real radius,
                                                 real relative_speed,
                                                 real fluid_dynamic_viscosity,
                                                 real radius_scaling_factor)
{
  const real rescaled_scaling_factor
      = reference_water_dynamic_viscosity * radius_scaling_factor / fluid_dynamic_viscosity;

  real Re = 0.;
  if (fluid_dynamic_viscosity > eps_1e9)
  {
    Re = fluid_density * (2. * radius) * relative_speed / fluid_dynamic_viscosity;
    Re /= rescaled_scaling_factor;
  }
  return Re;
}

// Particle Reynolds number with the viscosity of the fluid material (input
// option particle_reynolds_viscosity = "config"):
//   Re = d_real |u_f - v_p| / nu, d_real = (2 R) / k.
// Re = 0 when nu <= 0. Pass nu = 0 when the particle sits in a wall cell.
//   radius                 particle radius R
//   relative_speed         |u_f - v_p|
//   kinematic_viscosity    nu of the fluid material at the particle cell
//   radius_scaling_factor  k = R / R_real
NFLOW_HD inline real particle_reynolds_material(real radius,
                                                real relative_speed,
                                                real kinematic_viscosity,
                                                real radius_scaling_factor)
{
  real Re = 0.;
  if (kinematic_viscosity > real(0.))
  {
    const real real_particle_diameter = (2. * radius) / radius_scaling_factor;
    Re = real_particle_diameter * relative_speed / kinematic_viscosity;
  }
  return Re;
}

// Correction of the Stokes drag for finite Reynolds number: 1 + 0.15 Re^0.687.
NFLOW_HD inline real drag_correction_factor(real Re)
{
  return 1. + 0.15 * std::pow(Re, 0.687);
}

// Linear drag coefficient lambda with |F_drag| = lambda |u_f - v_p|:
//   lambda = 3 pi (2 R) mu_f C cg cg.
// A coarse-grained particle of radius R = k R_real stands for k^3 real particles,
// so its drag must be k^3 times the drag on one real particle. The Stokes form
// with the model diameter 2 R already scales with k, and cg = k supplies the
// remaining k^2 (cg = 1 when the correction is switched off). cg is multiplied
// twice in this order.
//   radius                   particle radius R
//   fluid_dynamic_viscosity  mu_f
//   correction_factor        C = drag_correction_factor(Re)
//   cg                       k with the coarse-grain correction, otherwise 1
NFLOW_HD inline real linear_drag_coefficient(real radius,
                                             real fluid_dynamic_viscosity,
                                             real correction_factor,
                                             real cg)
{
  return 3. * pi * (2. * radius) * fluid_dynamic_viscosity * correction_factor * cg * cg;
}

// Limit on the drag impulse of one explicit sub-step. With x = dt eps_f lambda / m,
// explicit time stepping of the drag alone overshoots the fluid velocity for x > 1.
// In that case the drag is scaled by 1 / x, so that one sub-step brings the
// particle at most to the fluid velocity. For x <= 1 the drag is unchanged.
//   drag            drag force lambda (u_f - v_p)
//   lambda          linear drag coefficient
//   particle_mass   m = rho_p V
//   fluid_fraction  eps_f = 1 - eps_p around the particle
//   dt              DEM sub-step
NFLOW_HD inline vec3 limit_drag_impulse(const vec3& drag,
                                        real lambda,
                                        real particle_mass,
                                        real fluid_fraction,
                                        real dt)
{
  vec3 ret = drag;
  if (particle_mass > real(0.))
  {
    const real drag_stiffness_ratio = dt * fluid_fraction * lambda / particle_mass;
    if (drag_stiffness_ratio > real(1.))
    {
      ret = ret * (real(1.) / drag_stiffness_ratio);
    }
  }
  return ret;
}

// Pressure gradient (buoyancy) force F_p = -V grad p.
NFLOW_HD inline vec3 pressure_gradient_force(real particle_volume, const vec3& pressure_gradient)
{
  return -particle_volume * pressure_gradient;
}

// Fluid state at the particle position and particle data for fluid_force_on_particle.
// All values are dimensional.
struct fluid_force_input
{
  vec3 fluid_velocity;              // u_f
  vec3 fluid_pressure_gradient;     // grad p
  real fluid_density;               // rho_f
  real fluid_kinematic_viscosity;   // nu_f
  real material_kinematic_viscosity;  // nu for particle_reynolds_material
  vec3 particle_velocity;           // v_p
  real particle_radius;             // R
  real particle_density;            // rho_p
  real solid_fraction;              // eps_p around the particle
  real radius_scaling_factor;       // k
  real dt;                          // DEM sub-step
  bool use_material_viscosity;      // Re from particle_reynolds_material
  bool coarse_grain_correction;     // cg = k in linear_drag_coefficient
};

// Fluid forces on one particle.
struct fluid_force_result
{
  vec3 drag;      // F_d after the impulse limit
  vec3 pressure;  // F_p
  vec3 total;     // eps_f (F_d + F_p), applied to the particle
};

// Fluid force on a particle: drag and pressure gradient force, weighted by the
// fluid fraction eps_f = 1 - eps_p.
NFLOW_HD inline fluid_force_result fluid_force_on_particle(const fluid_force_input& in)
{
  const real particle_volume = sphere_volume(in.particle_radius);
  const real fluid_dynamic_viscosity = in.fluid_density * in.fluid_kinematic_viscosity;

  const vec3 relative_velocity = in.fluid_velocity - in.particle_velocity;
  const real relative_speed = length(relative_velocity);

  real Re = 0.;
  if (in.use_material_viscosity)
  {
    Re = particle_reynolds_material(in.particle_radius, relative_speed,
                                    in.material_kinematic_viscosity, in.radius_scaling_factor);
  }
  else
  {
    Re = particle_reynolds_reference(in.fluid_density, in.particle_radius, relative_speed,
                                     fluid_dynamic_viscosity, in.radius_scaling_factor);
  }

  const real correction_factor = drag_correction_factor(Re);
  const real cg = in.coarse_grain_correction ? in.radius_scaling_factor : real(1.);
  const real lambda
      = linear_drag_coefficient(in.particle_radius, fluid_dynamic_viscosity, correction_factor, cg);

  const real eps_p = in.solid_fraction;
  const real eps_f = 1. - eps_p;
  const real particle_mass = in.particle_density * particle_volume;

  fluid_force_result ret;
  ret.drag = limit_drag_impulse(lambda * relative_velocity, lambda, particle_mass, eps_f, in.dt);
  ret.pressure = pressure_gradient_force(particle_volume, in.fluid_pressure_gradient);
  ret.total = (ret.drag + ret.pressure) * eps_f;
  return ret;
}

// Kernel weights below this value give no reaction force.
constexpr double reaction_weight_min = 1e-6;

// Reaction of the fluid force of one particle on one fluid cell:
//   f_cell += -(w V_cell) (F_d + F_p).
// w is the discrete delta weight between the particle and the cell centre
// (units 1 / length^3) and V_cell = dx^3 is the cell volume, so w V_cell is the
// share of the particle force taken by this cell. The reaction uses F_d + F_p
// before the factor eps_f. The sum over particles is the body force from the
// particles on the cell.
NFLOW_HD inline vec3 reaction_force_on_cell(real weight,
                                            real cell_volume,
                                            const vec3& drag,
                                            const vec3& pressure)
{
  const vec3 total_fluid_force = drag + pressure;
  return -(weight * cell_volume) * total_fluid_force;
}
}  // namespace nflow::fluid_dem
