package kr.co.n2m.platform.meta.federation.api.domain;

import java.util.List;
import java.util.Map;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

@Schema(description="디지털 트윈 기본 Dto (등록/수정용)")
@Getter
@Setter
public class ApiDigitalTwinBaseDto {

	private String dtid;
	private String type;
	private String name;
	private String description;
	private String owner;
	private String contactPoint;
	private String creator;
	private String creationTime;
	private String modificationTime;
	private List<String> subjects;
	private List<String> keywords;
	private Map<String, String> location;
	private String pointOfAccess;
	
	private String countryCode;
	private String classificationTypeCode;
	private String classificationCode;
	
}
