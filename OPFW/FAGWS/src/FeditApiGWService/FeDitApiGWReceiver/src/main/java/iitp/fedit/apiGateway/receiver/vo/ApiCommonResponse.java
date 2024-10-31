package iitp.fedit.apiGateway.receiver.vo;

import io.swagger.v3.oas.annotations.media.Schema;

public class  ApiCommonResponse<T> {
    
	@Schema(description = "Http 응답 코드")
    private Integer statusCode;

    @Schema(description = "응답 데이터")
    private Object data;
    


	
	
	public Object getData() {
		return data;
	}

	public void setData(Object data) {
		this.data = data;
	}

	public Integer getStatusCode() {
		return statusCode;
	}

	public void setStatusCode(Integer statusCode) {
		this.statusCode = statusCode;
	}
    
    
    
    
    
    
}