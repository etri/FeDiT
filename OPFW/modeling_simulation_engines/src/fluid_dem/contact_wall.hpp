// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Particle-wall contact force. A wall surface is represented by small wall
// spheres that carry the outward wall normal. Each touching wall sphere gives a
// Hertz-Mindlin contact with the particle radius and particle mass, and the
// contact forces are averaged over all touching wall spheres.

#pragma once

#include "contact_model.hpp"

namespace nflow::fluid_dem
{
// Contact force on a particle from one touching wall sphere for one DEM sub-step.
//   p                state of the particle
//   mat_p            material of the particle (elastic constants)
//   mat_wall         material of the wall. The friction, rolling friction and
//                    restitution coefficients are taken from the wall.
//   n                unit wall normal pointing from the wall toward the particle
//   overlap          delta = R - gap, the gap being the normal distance from the
//                    wall surface to the particle centre (> 0 for a contact)
//   stored_xi        tangential displacement kept for this wall face
//   has_history      false for a new contact; xi then starts from zero
//   advance_history  false when another wall sphere of the same wall face has
//                    already advanced xi in this sub-step; xi is then used as given
//   inertia          moment of inertia of the particle, see sphere_inertia
//   dt               DEM sub-step
// The wall is at rest. The effective radius is the particle radius and the
// effective mass is the particle mass. Unlike the particle-particle contact,
// the Coulomb limit applies only when it is positive.
NFLOW_HD inline contact_result wall_contact(const sphere_state& p,
                                            const contact_material& mat_p,
                                            const contact_material& mat_wall,
                                            const vec3& n,
                                            real overlap,
                                            const vec3& stored_xi,
                                            bool has_history,
                                            bool advance_history,
                                            real inertia,
                                            real dt)
{
  contact_result ret;

  // Velocity of the wall relative to the particle at the contact point.
  const vec3 contact_arm = -(p.radius - 0.5 * overlap) * n;
  const vec3 v_rel = zero_vec3() - (p.velocity + cross(p.angular_velocity, contact_arm));
  const vec3 v_n = dot(v_rel, n) * n;
  const vec3 v_t = v_rel - v_n;

  bool advance = true;
  vec3 xi = zero_vec3();
  if (has_history)
  {
    advance = advance_history;
    xi = stored_xi;
    if (advance)
    {
      xi = project_to_tangent_plane(xi, n);
    }
  }
  if (advance)
  {
    xi = add_tangential_slip(xi, v_t, dt);
  }

  const real E_eff = effective_youngs_modulus(mat_p.youngs_modulus, mat_p.poisson_ratio,
                                              mat_wall.youngs_modulus, mat_wall.poisson_ratio);
  const real G_i = shear_modulus(mat_p.youngs_modulus, mat_p.poisson_ratio);
  const real G_j = shear_modulus(mat_wall.youngs_modulus, mat_wall.poisson_ratio);
  const real G_eff = effective_shear_modulus(G_i, mat_p.poisson_ratio, G_j,
                                             mat_wall.poisson_ratio);

  const real mu = mat_wall.friction_coefficient;
  const real mu_roll = mat_wall.rolling_friction_coefficient;
  const real e_n = mat_wall.restitution_coefficient;

  // Normal force: elastic + damping.
  const real radius_eff = p.radius;
  const real k_n = normal_stiffness(E_eff, radius_eff);
  const real gamma_n = normal_damping(e_n, radius_eff, p.mass, E_eff, overlap);

  const vec3 n_f_e = k_n * (overlap * std::sqrt(overlap)) * n;
  const vec3 n_f_d = gamma_n * v_n;
  const vec3 n_force = n_f_e + n_f_d;

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
  if (t_trial_len > coulomb_limit && coulomb_limit > 0.0)
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

  const vec3 torque_arm = p.radius * n;

  ret.force = n_force + t_force;
  ret.normal_force = n_force;
  ret.tangential_force = t_force;
  ret.tangential_displacement = xi;
  ret.angular_acceleration = cross(t_force, torque_arm) / inertia;
  ret.rolling_torque = rolling_resistance_torque(mu_roll, n_force_len, p.radius,
                                                 p.angular_velocity);
  return ret;
}

// Wall contact result of one particle for one sub-step.
struct wall_contact_total
{
  vec3 force;                 // averaged wall contact force
  vec3 angular_acceleration;  // averaged tangential part + capped rolling part
  real rolling_budget_used;   // rolling torque taken from the budget I |omega| / dt
};

// Averages the wall contacts of one particle and applies the rolling torque cap.
// The sums are divided by the number of touching wall spheres. The averaged
// rolling torque is limited to the budget I |omega| / dt and adds T_r / I to the
// angular acceleration. The particle contacts later use what is left of the budget.
//   force_sum           sum of contact_result::force over wall contacts
//   angular_acc_sum     sum of contact_result::angular_acceleration over wall contacts
//   rolling_torque_sum  sum of contact_result::rolling_torque over wall contacts
//   contact_count       number of touching wall spheres
//   inertia             moment of inertia I of the particle
//   omega               angular velocity of the particle
//   dt                  DEM sub-step
NFLOW_HD inline wall_contact_total wall_contact_average(vec3 force_sum,
                                                        vec3 angular_acc_sum,
                                                        vec3 rolling_torque_sum,
                                                        real contact_count,
                                                        real inertia,
                                                        const vec3& omega,
                                                        real dt)
{
  if (contact_count > eps_1e12)
  {
    const real inv = 1.0 / contact_count;
    force_sum = force_sum * inv;
    angular_acc_sum = angular_acc_sum * inv;
    rolling_torque_sum = rolling_torque_sum * inv;
  }

  const real roll_budget = rolling_torque_budget(inertia, omega, dt);
  real roll_len = length(rolling_torque_sum);
  if (roll_len > roll_budget)
  {
    rolling_torque_sum = rolling_torque_sum * (roll_budget / roll_len);
    roll_len = roll_budget;
  }

  wall_contact_total ret;
  ret.force = force_sum;
  ret.angular_acceleration = angular_acc_sum + rolling_torque_sum / inertia;
  ret.rolling_budget_used = roll_len;
  return ret;
}
}  // namespace nflow::fluid_dem
