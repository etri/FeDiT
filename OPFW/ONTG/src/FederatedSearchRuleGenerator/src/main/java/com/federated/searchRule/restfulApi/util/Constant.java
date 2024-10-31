package com.federated.searchRule.restfulApi.util;

import org.springframework.http.HttpStatus;

public class Constant {
	// 400 에러
	public static final HttpStatus HTTP_BAD_REQ_ERROR_STAT = HttpStatus.BAD_REQUEST;
	public static final int HTTP_BAD_REQ_ERROR_CODE = HTTP_BAD_REQ_ERROR_STAT.value();

	// 200 성공
	public static final HttpStatus HTTP_OK_STAT = HttpStatus.OK;
	public static final int HTTP_OK_CODE = HTTP_OK_STAT.value();

	// 201 성공
	public static final HttpStatus HTTP_CREATE_STAT = HttpStatus.CREATED;
	public static final int HTTP_CREATE_CODE = HTTP_CREATE_STAT.value();

	// 204 성공
	public static final HttpStatus HTTP_DELETE_STAT = HttpStatus.NO_CONTENT;
	public static final int HTTP_DELETE_CODE = HTTP_DELETE_STAT.value();

	// 500 에러
	public static final HttpStatus HTTP_SERVER_ERROR_STAT = HttpStatus.INTERNAL_SERVER_ERROR;
	public static final int HTTP_SERVER_ERROR_CODE = HTTP_SERVER_ERROR_STAT.value();

	// 401 인증 에러
	public static final HttpStatus HTTP_AUTHORIZED_ERROR_STAT = HttpStatus.UNAUTHORIZED;
	public static final int HTTP_AUTHORIZED_ERROR_CODE = HTTP_AUTHORIZED_ERROR_STAT.value();

	// 404 인증 에러
	public static final HttpStatus HTTP_NOT_FOUND_STAT = HttpStatus.NOT_FOUND;
	public static final int HTTP_NOT_FOUND_CODE = HTTP_NOT_FOUND_STAT.value();

}
