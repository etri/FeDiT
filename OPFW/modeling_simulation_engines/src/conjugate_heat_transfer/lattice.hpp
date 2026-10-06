// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Lattice helpers of the temperature model. The D3Q27 velocity set and the
// weights come from ../common/d3q27.hpp; this file adds the projection e_i . v
// of a vector on a lattice direction.

#pragma once

#include "../common/d3q27.hpp"
#include "../common/nflow_formula.hpp"

namespace nflow::conjugate_heat_transfer
{
using d3q27::cx;
using d3q27::cy;
using d3q27::cz;
using d3q27::opposite;
using d3q27::weight;

// Projection e_i . v of a vector v on lattice direction i, summed in the
// order x, y, z.
NFLOW_HD inline real project(int i, const vec3& v)
{
  real ret = 0;
  ret += real(cx(i)) * v[0];
  ret += real(cy(i)) * v[1];
  ret += real(cz(i)) * v[2];
  return ret;
}
}  // namespace nflow::conjugate_heat_transfer
