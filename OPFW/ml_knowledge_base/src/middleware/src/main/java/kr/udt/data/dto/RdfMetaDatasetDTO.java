package kr.udt.data.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * @설명 : RDF 메타 변동태그 (RDF관리 - 연합 디지털트윈에서 사용안함)
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 11. 08
 * @비고 : 
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RdfMetaDatasetDTO {
	
	private BigDecimal jobId;
	
	private String dctTitle;
	
	private String dctAccessrights;

	private String dctDescription;
	
	private String dctIdentifier;
	
	private String dcatTheme;
	
	private String dcatKeyword;
	
	private String dcatLandingpage;
	
	private String priceinfo;
	
	private String regDt;
	
	private String regId;
	
	private String updtDt;
	
	private String updtId;
}
