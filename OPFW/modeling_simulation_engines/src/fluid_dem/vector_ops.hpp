// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Vector arithmetic and numerical thresholds used by the fluid-DEM formula
// headers. Every operation works component by component in the order written,
// so the formulas in the other headers keep the evaluation order of the solver.
// The dot product is nflow::dot from the common header. The operators are
// declared in nflow::fluid_dem; code outside this namespace uses them through
// a using-directive.

#pragma once

#include "../common/nflow_formula.hpp"

#include <cmath>

namespace nflow::fluid_dem
{
// pi with the precision used by the solver.
constexpr double pi = 3.14159265358979323846;

// Thresholds below which the solver treats a quantity as zero.
constexpr double eps_1e12 = 1e-12;
constexpr double eps_1e9 = 1e-9;

// Builds a vector from its components.
NFLOW_HD inline vec3 make_vec3(real x, real y, real z)
{
  vec3 ret;
  ret[0] = x;
  ret[1] = y;
  ret[2] = z;
  return ret;
}

// Zero vector.
NFLOW_HD inline vec3 zero_vec3()
{
  return make_vec3(0., 0., 0.);
}

NFLOW_HD inline vec3 operator+(const vec3& a, const vec3& b)
{
  return make_vec3(a[0] + b[0], a[1] + b[1], a[2] + b[2]);
}

NFLOW_HD inline vec3 operator-(const vec3& a, const vec3& b)
{
  return make_vec3(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

NFLOW_HD inline vec3 operator-(const vec3& a)
{
  return make_vec3(-a[0], -a[1], -a[2]);
}

NFLOW_HD inline vec3 operator*(real s, const vec3& a)
{
  return make_vec3(s * a[0], s * a[1], s * a[2]);
}

NFLOW_HD inline vec3 operator*(const vec3& a, real s)
{
  return make_vec3(a[0] * s, a[1] * s, a[2] * s);
}

NFLOW_HD inline vec3 operator/(const vec3& a, real s)
{
  return make_vec3(a[0] / s, a[1] / s, a[2] / s);
}

// Cross product a x b.
NFLOW_HD inline vec3 cross(const vec3& a, const vec3& b)
{
  return make_vec3(a[1] * b[2] - a[2] * b[1],
                   a[2] * b[0] - a[0] * b[2],
                   a[0] * b[1] - a[1] * b[0]);
}

// Euclidean length |a|.
NFLOW_HD inline real length(const vec3& a)
{
  return std::sqrt(dot(a, a));
}

// x^2 and x^3 evaluated as x * x and x * (x * x).
NFLOW_HD inline real pow2(real x)
{
  return x * x;
}

NFLOW_HD inline real pow3(real x)
{
  return x * (x * x);
}
}  // namespace nflow::fluid_dem
