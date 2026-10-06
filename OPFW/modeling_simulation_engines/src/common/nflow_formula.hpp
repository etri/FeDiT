// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Common definitions for the formula headers in this directory.
//
// The headers under src/ are excerpts of the physical models used by the
// NFLOW lattice Boltzmann solvers. They show how each model computes its
// equilibrium distributions, collision terms, forces, boundary values and
// macroscopic quantities. They are not a complete solver: the lattice data
// structures, streaming, grid refinement and time stepping are not included.

#pragma once

#if defined(__CUDACC__)
#define NFLOW_HD __host__ __device__
#else
#define NFLOW_HD
#endif

namespace nflow
{
#ifdef NFLOW_USE_SINGLE_PRECISION
using real = float;
#else
using real = double;
#endif

// Fixed-size array of reals with value semantics.
template <int N>
struct real_array
{
  real v[N];

  NFLOW_HD real& operator[](int i) { return v[i]; }
  NFLOW_HD const real& operator[](int i) const { return v[i]; }
};

// Three-component vector (x, y, z).
using vec3 = real_array<3>;

// Distribution functions. The solvers keep 27 entries per population.
// Each model header states which entries it uses and in what order.
using dist27 = real_array<27>;

// Dot product a . b. The sum starts from zero and adds the x, y and z terms in
// that order, as the solvers do; a different order can change the last bit.
NFLOW_HD inline real dot(const vec3& a, const vec3& b)
{
  real r = 0;
  r += a[0] * b[0];
  r += a[1] * b[1];
  r += a[2] * b[2];
  return r;
}
}  // namespace nflow
