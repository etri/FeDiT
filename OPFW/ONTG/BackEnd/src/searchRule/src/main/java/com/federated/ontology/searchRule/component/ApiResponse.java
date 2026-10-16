package com.federated.ontology.searchRule.component;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {

    private boolean success;
    private String code;
    private T data;
    private String message;

    public static <T> ApiResponse<T> ok(T data) {
        ApiResponse<T> res = new ApiResponse<>();
        res.success = true;
        res.code = "OK";
        res.data = data;
        res.message = "success";
        return res;
    }

    public static <T> ApiResponse<T> error(String code, String message) {
        ApiResponse<T> res = new ApiResponse<>();
        res.success = false;
        res.code = code;
        res.message = message;
        return res;
    }
}
