// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Hertz-Mindlin contact formulas shared by the particle-particle and
// particle-wall contacts: sphere mass and inertia, effective elastic moduli,
// Hertz normal stiffness, restitution-based normal damping, Mindlin tangential
// stiffness, the incremental tangential displacement, cohesion and rolling
// resistance with its per-sub-step torque budget.

#pragma once

#include "vector_ops.hpp"

namespace nflow::fluid_dem
{
// Material properties of one contact partner (a particle or a wall).
struct contact_material
{
  real youngs_modulus;                // E
  real poisson_ratio;                 // nu
  real friction_coefficient;          // mu, sliding friction
  real rolling_friction_coefficient;  // mu_r
  real restitution_coefficient;       // e_n
  real cohesive_energy_density;       // CED [J/m^3], used by particle-particle contact
};

// State of a spherical particle at the start of the contact evaluation.
struct sphere_state
{
  vec3 velocity;          // v
  vec3 angular_velocity;  // omega
  real radius;            // R
  real mass;              // m, see contact_sphere_mass
};

// Particle mass used by the contact model: m = rho R^3 (4/3) pi.
//   density  rigid density of the particle rho
//   radius   particle radius R
NFLOW_HD inline real contact_sphere_mass(real density, real radius)
{
  return density * pow3(radius) * (4.0 / 3.0) * pi;
}

// Moment of inertia of a solid sphere: I = 0.4 m R^2.
NFLOW_HD inline real sphere_inertia(real mass, real radius)
{
  return 0.4 * mass * pow2(radius);
}

// Effective Young's modulus of two bodies i and j:
// E* = E_i E_j / [E_j (1 - nu_i^2) + E_i (1 - nu_j^2)].
NFLOW_HD inline real effective_youngs_modulus(real E_i, real nu_i, real E_j, real nu_j)
{
  return (E_i * E_j) / (E_j * (1. - nu_i * nu_i) + E_i * (1. - nu_j * nu_j));
}

// Shear modulus G = E / [2 (1 + nu)].
NFLOW_HD inline real shear_modulus(real E, real nu)
{
  return E / (2. * (1. + nu));
}

// Effective shear modulus of two bodies i and j:
// G* = G_i G_j / [G_j (2 - nu_i) + G_i (2 - nu_j)].
NFLOW_HD inline real effective_shear_modulus(real G_i, real nu_i, real G_j, real nu_j)
{
  return (G_i * G_j) / (G_j * (2. - nu_i) + G_i * (2. - nu_j));
}

// Effective radius of two particles with different radii: R* = R_i R_j / (R_i + R_j).
NFLOW_HD inline real effective_radius(real R_i, real R_j)
{
  return (R_i * R_j) / (R_i + R_j);
}

// Effective mass of two particles: m* = m_i m_j / (m_i + m_j).
NFLOW_HD inline real effective_mass(real m_i, real m_j)
{
  return (m_i * m_j) / (m_i + m_j);
}

// Hertz normal stiffness k_n = (4/3) E* sqrt(R*). The elastic normal force is
// k_n delta^(3/2) n for the overlap delta.
NFLOW_HD inline real normal_stiffness(real E_eff, real R_eff)
{
  return (4.0 / 3.0) * E_eff * std::sqrt(R_eff);
}

// Normal damping coefficient from the restitution coefficient e_n:
//   gamma_n = -(2/3) sqrt(15) R*^(1/4) sqrt(m* E*) ln(e_n) delta^(1/4) / sqrt(pi^2 + ln(e_n)^2).
// For e_n -> 0 the factor ln(e_n) / sqrt(pi^2 + ln(e_n)^2) tends to -1, which is
// used when e_n < 1e-12. The normal damping force is gamma_n v_n.
//   e_n      restitution coefficient
//   R_eff    effective radius R*
//   m_eff    effective mass m*
//   E_eff    effective Young's modulus E*
//   overlap  overlap delta
NFLOW_HD inline real normal_damping(real e_n, real R_eff, real m_eff, real E_eff, real overlap)
{
  const real radius_eff_q = std::sqrt(std::sqrt(R_eff));
  const real overlap_q = std::sqrt(std::sqrt(overlap));

  if (e_n < eps_1e12)
  {
    return (2.0 / 3.0) * std::sqrt(15.0) * radius_eff_q * std::sqrt(m_eff * E_eff) * overlap_q;
  }

  const real loge = std::log(e_n);
  const real denom = std::sqrt((pi * pi) + loge * loge);
  return -(2.0 / 3.0) * std::sqrt(15.0) * radius_eff_q * std::sqrt(m_eff * E_eff) * loge
         * overlap_q / denom;
}

// Mindlin tangential stiffness in the full-stick form: k_t = 8 G* sqrt(R* delta),
// evaluated as 8 G* sqrt(R*) sqrt(delta).
NFLOW_HD inline real tangential_stiffness(real G_eff, real R_eff, real overlap)
{
  return 8.0 * G_eff * std::sqrt(R_eff) * std::sqrt(overlap);
}

// Removes the normal component of a stored tangential displacement so that it
// lies in the current tangent plane: xi - n (xi . n).
NFLOW_HD inline vec3 project_to_tangent_plane(const vec3& xi, const vec3& n)
{
  return xi - (n * dot(xi, n));
}

// Adds the tangential slip of one sub-step: xi + v_t dt.
NFLOW_HD inline vec3 add_tangential_slip(const vec3& xi, const vec3& v_t, real dt)
{
  return xi + (v_t * dt);
}

// Cohesive normal force F_c = -(pi R* delta) CED n. The contact area pi R* delta
// times the cohesive energy density CED gives an attractive force along -n.
NFLOW_HD inline vec3 cohesion_force(real R_eff, real overlap, real cohesive_energy_density,
                                    const vec3& n)
{
  const real contact_area = pi * R_eff * overlap;
  const real f_c = contact_area * cohesive_energy_density;
  return -f_c * n;
}

// Rolling resistance torque of one contact: T_r = -mu_r |F_n| R omega / |omega|.
// It is zero when |omega| < 1e-12.
//   mu_roll           rolling friction coefficient mu_r
//   normal_force_len  magnitude of the normal contact force |F_n|
//   radius            particle radius R
//   omega             particle angular velocity
NFLOW_HD inline vec3 rolling_resistance_torque(real mu_roll, real normal_force_len, real radius,
                                               const vec3& omega)
{
  const real omega_len = length(omega);
  if (omega_len >= eps_1e12)
  {
    return -mu_roll * normal_force_len * radius * (omega / omega_len);
  }
  return zero_vec3();
}

// Largest rolling resistance torque allowed in one sub-step: I |omega| / dt.
// A torque of this size stops the rotation within the sub-step; the cap keeps
// the rolling resistance from reversing the spin. Wall and particle contacts
// share this budget.
NFLOW_HD inline real rolling_torque_budget(real inertia, const vec3& omega, real dt)
{
  return inertia * length(omega) / dt;
}

// Result of one contact evaluation for particle i.
struct contact_result
{
  vec3 force;                    // F_n + F_t on particle i
  vec3 normal_force;             // F_n
  vec3 tangential_force;         // F_t after the Coulomb limit
  vec3 tangential_displacement;  // xi to keep for the next sub-step
  vec3 angular_acceleration;     // (F_t x R_i n) / I_i
  vec3 rolling_torque;           // T_r before the budget cap
};
}  // namespace nflow::fluid_dem
