// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Particle-particle contact force. Hertz normal force with restitution damping
// and cohesion, Mindlin tangential force with an incremental tangential
// displacement and a Coulomb limit, and rolling resistance. Particles of
// different radii interact through the effective radius and effective mass.

#pragma once

#include "contact_model.hpp"

namespace nflow::fluid_dem
{
// Contact force on particle i from particle j for one DEM sub-step.
//   p_i, p_j      state of particles i and j
//   mat_i, mat_j  material of particles i and j. The friction, rolling friction,
//                 restitution and cohesion coefficients are taken from particle i.
//   n             unit normal (x_i - x_j) / |x_i - x_j|, pointing from j to i
//   overlap       delta = R_i + R_j - |x_i - x_j| (> 0 for a contact)
//   stored_xi     tangential displacement kept from the previous sub-step
//   has_history   false for a new contact; xi then starts from zero
//   inertia_i     moment of inertia of particle i, see sphere_inertia
//   dt            DEM sub-step
// The contact point lies in the middle of the overlap. The forces of all
// contacts of particle i are summed; the angular accelerations and rolling
// torques are summed and finished by particle_contact_rolling.
NFLOW_HD inline contact_result particle_contact(const sphere_state& p_i,
                                                const contact_material& mat_i,
                                                const sphere_state& p_j,
                                                const contact_material& mat_j,
                                                const vec3& n,
                                                real overlap,
                                                const vec3& stored_xi,
                                                bool has_history,
                                                real inertia_i,
                                                real dt)
{
  contact_result ret;

  const real mass_eff = effective_mass(p_i.mass, p_j.mass);
  const real radius_eff = effective_radius(p_i.radius, p_j.radius);

  // Relative velocity of j with respect to i at the contact point.
  const vec3 contact_arm_i = -(p_i.radius - 0.5 * overlap) * n;
  const vec3 contact_arm_j = (p_j.radius - 0.5 * overlap) * n;
  const vec3 v_ij = (p_j.velocity + cross(p_j.angular_velocity, contact_arm_j))
                    - (p_i.velocity + cross(p_i.angular_velocity, contact_arm_i));
  const vec3 v_n = dot(v_ij, n) * n;
  const vec3 v_t = v_ij - v_n;

  vec3 xi = zero_vec3();
  if (has_history)
  {
    xi = project_to_tangent_plane(stored_xi, n);
  }
  xi = add_tangential_slip(xi, v_t, dt);

  const real E_eff = effective_youngs_modulus(mat_i.youngs_modulus, mat_i.poisson_ratio,
                                              mat_j.youngs_modulus, mat_j.poisson_ratio);
  const real G_i = shear_modulus(mat_i.youngs_modulus, mat_i.poisson_ratio);
  const real G_j = shear_modulus(mat_j.youngs_modulus, mat_j.poisson_ratio);
  const real G_eff = effective_shear_modulus(G_i, mat_i.poisson_ratio, G_j, mat_j.poisson_ratio);

  const real mu = mat_i.friction_coefficient;
  const real mu_roll = mat_i.rolling_friction_coefficient;
  const real e_n = mat_i.restitution_coefficient;

  // Normal force: elastic + damping + cohesion.
  const real k_n = normal_stiffness(E_eff, radius_eff);
  const real gamma_n = normal_damping(e_n, radius_eff, mass_eff, E_eff, overlap);

  const vec3 n_f_e = k_n * (overlap * std::sqrt(overlap)) * n;
  const vec3 n_f_d = gamma_n * v_n;
  const vec3 n_f_c = cohesion_force(radius_eff, overlap, mat_i.cohesive_energy_density, n);
  const vec3 n_force = n_f_e + n_f_d + n_f_c;

  // Tangential force: spring on xi + damping, limited by Coulomb friction.
  const real k_t = tangential_stiffness(G_eff, radius_eff, overlap);
  const real gamma_t = gamma_n;

  const vec3 t_f_e = k_t * xi;
  const vec3 t_f_d = gamma_t * v_t;
  const vec3 t_trial = t_f_e + t_f_d;
  const real t_trial_len = length(t_trial);

  const real n_force_len = length(n_force);
  const real coulomb_limit = mu * n_force_len;

  vec3 t_force;
  if (t_trial_len > coulomb_limit)
  {
    // Sliding: the force sits on the Coulomb limit and xi is reset to the
    // displacement that gives this force.
    t_force = (t_trial_len > eps_1e12) ? (coulomb_limit * (t_trial / t_trial_len)) : zero_vec3();
    if (k_t > eps_1e12)
    {
      xi = (t_force - t_f_d) / k_t;
    }
  }
  else
  {
    t_force = t_trial;
  }

  const vec3 torque_arm = p_i.radius * n;

  ret.force = n_force + t_force;
  ret.normal_force = n_force;
  ret.tangential_force = t_force;
  ret.tangential_displacement = xi;
  ret.angular_acceleration = cross(t_force, torque_arm) / inertia_i;
  ret.rolling_torque = rolling_resistance_torque(mu_roll, n_force_len, p_i.radius,
                                                 p_i.angular_velocity);
  return ret;
}

// Finishes the angular acceleration of particle i from its particle contacts.
// The particle contacts are evaluated after the wall contacts and may only use
// the part of the rolling torque budget I |omega| / dt that the wall contacts
// left. The total angular acceleration of the particle is the wall result plus
// the value returned here.
//   angular_acc_sum      sum of contact_result::angular_acceleration over particle contacts
//   rolling_torque_sum   sum of contact_result::rolling_torque over particle contacts
//   inertia              moment of inertia I of particle i
//   omega                angular velocity of particle i
//   dt                   DEM sub-step
//   wall_budget_used     rolling torque used by the wall contacts (wall_contact_total)
NFLOW_HD inline vec3 particle_contact_rolling(const vec3& angular_acc_sum,
                                              vec3 rolling_torque_sum,
                                              real inertia,
                                              const vec3& omega,
                                              real dt,
                                              real wall_budget_used)
{
  const real roll_budget = rolling_torque_budget(inertia, omega, dt);
  real roll_left = roll_budget - wall_budget_used;
  if (roll_left < 0.)
  {
    roll_left = 0.;
  }

  const real roll_len = length(rolling_torque_sum);
  if (roll_len > roll_left)
  {
    rolling_torque_sum = rolling_torque_sum * (roll_left / roll_len);
  }
  return angular_acc_sum + rolling_torque_sum / inertia;
}
}  // namespace nflow::fluid_dem
