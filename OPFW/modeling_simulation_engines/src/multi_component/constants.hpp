// SPDX-License-Identifier: LGPL-2.1-only
// Copyright (c) 2022-2026 E8IGHT Co., Ltd.
//
// Constants shared by the two-component phase-field formulas in this
// directory: the small value added to denominators (and used to detect a
// 90-degree contact angle) and the number pi.

#pragma once

#include "../common/nflow_formula.hpp"

namespace nflow::multi_component
{
// Small positive value that keeps denominators away from zero.
#ifdef NFLOW_USE_SINGLE_PRECISION
constexpr real epsilon = 1e-6f;
#else
constexpr real epsilon = 1e-12;
#endif

// pi in double precision; angle conversions are evaluated in double.
constexpr double pi = 3.14159265358979323846;
}  // namespace nflow::multi_component
