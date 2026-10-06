// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Forces of the two-component model. The flow receives surface tension
// (continuum surface force scaled by density), the pressure force, the viscous
// term caused by the density gradient and the body force. The order parameter
// equation receives the interface force that keeps the profile sharp.

#pragma once

#include <cmath>

#include "../common/nflow_formula.hpp"
#include "constants.hpp"

namespace nflow::multi_component
{
// Gradient of a vector field v: grad[a][b] = d v_b / d x_a.
struct vector_gradient
{
  vec3 row[3];

  NFLOW_HD vec3& operator[](int a) { return row[a]; }
  NFLOW_HD const vec3& operator[](int a) const { return row[a]; }
};

// Unit interface normal n = grad(phi) / (|grad(phi)| + epsilon).
// grad_phi: gradient of the order parameter phi.
NFLOW_HD inline vec3 interface_normal(const vec3& grad_phi)
{
  real denominator = sqrt(grad_phi[0] * grad_phi[0] + grad_phi[1] * grad_phi[1]
                          + grad_phi[2] * grad_phi[2])
                     + epsilon;

  vec3 ret;
  ret[0] = grad_phi[0] / denominator;
  ret[1] = grad_phi[1] / denominator;
  ret[2] = grad_phi[2] / denominator;
  return ret;
}

// Interface curvature kappa = -div(n).
// grad_n: gradient of the interface normal n.
NFLOW_HD inline real interface_curvature(const vector_gradient& grad_n)
{
  real curvature = -grad_n[0][0] - grad_n[1][1] - grad_n[2][2];
  return curvature;
}

// Density gradient grad(rho) = (rho_H - rho_L) grad(phi).
// grad_phi: gradient of phi; density_high, density_low: rho_H, rho_L.
NFLOW_HD inline vec3 density_gradient(const vec3& grad_phi, real density_high, real density_low)
{
  vec3 ret;
  ret[0] = (density_high - density_low) * grad_phi[0];
  ret[1] = (density_high - density_low) * grad_phi[1];
  ret[2] = (density_high - density_low) * grad_phi[2];
  return ret;
}

// Surface tension F_s = sigma kappa grad(phi) rho / ((rho_H + rho_L) / 2).
// surface_tension: sigma; curvature: kappa; grad_phi: gradient of phi;
// density: local rho; density_high, density_low: rho_H, rho_L.
NFLOW_HD inline vec3 surface_tension_force(real surface_tension,
                                           real curvature,
                                           const vec3& grad_phi,
                                           real density,
                                           real density_high,
                                           real density_low)
{
  vec3 ret;
  ret[0] = surface_tension * curvature * grad_phi[0] * density / (0.5 * (density_high + density_low));
  ret[1] = surface_tension * curvature * grad_phi[1] * density / (0.5 * (density_high + density_low));
  ret[2] = surface_tension * curvature * grad_phi[2] * density / (0.5 * (density_high + density_low));
  return ret;
}

// Pressure force F_p = -grad(p).
// grad_p: gradient of the pressure p.
NFLOW_HD inline vec3 pressure_force(const vec3& grad_p)
{
  vec3 ret;
  ret[0] = -grad_p[0];
  ret[1] = -grad_p[1];
  ret[2] = -grad_p[2];
  return ret;
}

// Viscous force from the density gradient F_mu = nu (grad(u) + grad(u)^T) . grad(rho).
// kinematic_viscosity: nu = mu / rho + nu_t; grad_u: velocity gradient;
// grad_rho: density gradient.
NFLOW_HD inline vec3 viscous_force(real kinematic_viscosity,
                                   const vector_gradient& grad_u,
                                   const vec3& grad_rho)
{
  vec3 ret;
  ret[0] = kinematic_viscosity
           * (2. * grad_u[0][0] * grad_rho[0] + (grad_u[0][1] + grad_u[1][0]) * grad_rho[1]
              + (grad_u[0][2] + grad_u[2][0]) * grad_rho[2]);
  ret[1] = kinematic_viscosity
           * ((grad_u[0][1] + grad_u[1][0]) * grad_rho[0] + 2. * grad_u[1][1] * grad_rho[1]
              + (grad_u[1][2] + grad_u[2][1]) * grad_rho[2]);
  ret[2] = kinematic_viscosity
           * ((grad_u[0][2] + grad_u[2][0]) * grad_rho[0]
              + (grad_u[1][2] + grad_u[2][1]) * grad_rho[1] + 2. * grad_u[2][2] * grad_rho[2]);
  return ret;
}

// Body force F_b = rho g + s.
// density: rho; gravity: g; momentum_source: s, momentum source per unit volume.
NFLOW_HD inline vec3 body_force(real density, const vec3& gravity, const vec3& momentum_source)
{
  vec3 ret;
  ret[0] = density * gravity[0] + momentum_source[0];
  ret[1] = density * gravity[1] + momentum_source[1];
  ret[2] = density * gravity[2] + momentum_source[2];
  return ret;
}

// Total force on the flow F = F_s + F_p + F_mu + F_b.
NFLOW_HD inline vec3 total_force(const vec3& surface_tension,
                                 const vec3& pressure,
                                 const vec3& viscous,
                                 const vec3& body)
{
  vec3 ret;
  ret[0] = surface_tension[0] + pressure[0] + viscous[0] + body[0];
  ret[1] = surface_tension[1] + pressure[1] + viscous[1] + body[1];
  ret[2] = surface_tension[2] + pressure[2] + viscous[2] + body[2];
  return ret;
}

// Interface force of the phi equation F_phi = 4 phi (1 - phi) / (3 W) n, the
// sharpening flux of the conservative Allen-Cahn equation times c_s^2 = 1/3.
// It is switched off (F_phi = 0) when miscibility_flag is 0.
// order_parameter: phi; interface_width: W in lattice units of the local grid;
// normal: unit interface normal n; miscibility_flag: model switch for the pair.
NFLOW_HD inline vec3 interface_sharpening_force(real order_parameter,
                                                real interface_width,
                                                const vec3& normal,
                                                unsigned int miscibility_flag)
{
  vec3 force_phi;
  force_phi[0] = 4.0 * order_parameter * (1.0 - order_parameter) / (3.0 * interface_width) * normal[0];
  force_phi[1] = 4.0 * order_parameter * (1.0 - order_parameter) / (3.0 * interface_width) * normal[1];
  force_phi[2] = 4.0 * order_parameter * (1.0 - order_parameter) / (3.0 * interface_width) * normal[2];

  if (miscibility_flag == 0)
  {
    force_phi[0] = 0.0;
    force_phi[1] = 0.0;
    force_phi[2] = 0.0;
  }

  return force_phi;
}
}  // namespace nflow::multi_component
