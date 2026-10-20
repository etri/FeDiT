#pragma once
#include "../common/common.h"
#include <cmath>
#include <climits>
#include <stdexcept>
#include <unordered_set>

namespace request_validation {
inline std::string text(const Json::Value& value, const std::string& key) {
    if (!value.isObject() || !value[key].isString() || value[key].asString().empty())
        throw std::invalid_argument("Missing or invalid string: " + key);
    return value[key].asString();
}

inline double number(const Json::Value& value, const std::string& key, double fallback) {
    if (!value.isObject()) throw std::invalid_argument("Expected an object");
    if (!value.isMember(key)) return fallback;
    if (!value[key].isNumeric() || !std::isfinite(value[key].asDouble()))
        throw std::invalid_argument("Invalid finite number: " + key);
    return value[key].asDouble();
}

inline void times(double start, double end) {
    if (!std::isfinite(start) || !std::isfinite(end) || start < 0 || end < start)
        throw std::invalid_argument("Simulation times must be finite and 0 <= start <= end");
}

// Validate the entire tree before creating any models. Bound recursion as model
// documents arrive from clients and nested documents can otherwise exhaust the stack.
inline void model(const Json::Value& node, unsigned depth = 0) {
    if (!node.isObject() || depth > 64)
        throw std::invalid_argument("Invalid model object or excessive nesting");
    if (node.isMember(PROTOCOL::COUPLED::CHILD_MODELS)) {
        const auto& children = node[PROTOCOL::COUPLED::CHILD_MODELS];
        if (!children.isArray()) throw std::invalid_argument("models must be an array");
        for (const auto& child : children) model(child, depth + 1);
    }
    if (node.isMember(PROTOCOL::COUPLED::MODEL_INFO::MODEL_TYPE)) {
        const auto& type = node[PROTOCOL::COUPLED::MODEL_INFO::MODEL_TYPE];
        if (!type.isInt()) throw std::invalid_argument("model_type must be an integer");
    }
}

inline void parameters(const Json::Value& sets) {
    if (!sets.isArray() || sets.empty())
        throw std::invalid_argument("param_sets must be a non-empty array");
    std::unordered_set<int> ids;
    int index = 0;
    for (const auto& set : sets) {
        if (!set.isObject()) throw std::invalid_argument("Invalid parameter set");
        const auto id = set.get(PROTOCOL::SIM_CTL::RUN_ID, index++);
        if (!id.isInt() || id.asInt() < 0 || id.asInt() == INT_MAX || !ids.insert(id.asInt()).second)
            throw std::invalid_argument("Invalid or duplicate run_id");
        if (set.isMember(PROTOCOL::SIM_CTL::OVERRIDES) && !set[PROTOCOL::SIM_CTL::OVERRIDES].isObject())
            throw std::invalid_argument("overrides must be an object");
    }
}
}
