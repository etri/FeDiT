package net.jw.twin.repository.client.dto;

import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Getter
@Setter
public class DtoDataItemRequest {
    @NotBlank(message = "데이터타입을 입력해 주세요.")
    @Size(max=30, message = "데이터타입을 30자 이하로 입력해 주세요.")
    private String type;
    @NotBlank(message = "데이터이름을 입력해 주세요.")
    @Size(max=50, message = "데이터이름을 50자 이하로 입력해 주세요.")
    private String name;
    @NotBlank(message = "데이터분류를 입력해 주세요.")
    @Size(max=20, message = "데이터분류를 20자 이하로 입력해 주세요.")
    private String category;
    @Size(max=2000, message = "API 문서 Tag List를 2000자 이하로 입력해 주세요.")
    private String swaggerTagList;
    @NotBlank(message = "API Type을 입력해 주세요.")
    @Size(max=20, message = "API Type을 20자 이하로 입력해 주세요.")
    private String apiType;
    @NotBlank(message = "데이터포맷을 입력해 주세요.")
    @Size(max=20, message = "데이터포맷을 20자 이하로 입력해 주세요.")
    private String dataFormat;
    @NotBlank(message = "서비스아이디 값을 입력해 주세요.")
    @Size(max=50, message = "서비스아이디를 50자 이하로 입력해 주세요.")
    private String serviceId;
    @Size(max=200, message = "외부URL을 200자 이하로 입력해 주세요.")
    private String externalUrl;
    @Size(max=200, message = "REST IP를 200자 이하로 입력해 주세요.")
    private String restIp;
    @Min(value=0, message = "REST PORT를 0~65535 사이의 값으로 입력해 주세요.")
    @Max(value=65535, message = "REST PORT를 0~65535 사이의 값으로 입력해 주세요.")
    private Integer restPort;
    @Size(max=200, message = "API 문서 URL을 200자 이하로 입력해 주세요.")
    private String swaggerUrl;
    @NotBlank(message = "API 문서 HOMEPATH를 입력해 주세요.")
    @Size(max=50, message = "API 문서 HOMEPATH를 50자 이하로 입력해 주세요.")
    private String swaggerHomepath;
    @Size(max=2000, message = "설명을 2000자 이하로 입력해 주세요.")
    private String description;
}
