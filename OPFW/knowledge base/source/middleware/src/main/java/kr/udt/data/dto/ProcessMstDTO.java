package kr.udt.data.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * @설명 : 프로세스 마스터 + 잡프로세스 실행단계(JOB_PROCESS_SN(+))
 * @작성자 : ICTWAY - 최성식 선임
 * @생성일 : 2022. 11. 07.
 * @비고 : 
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessMstDTO {
	
	/***JOB_PROCESS_SN TABLE****/	
	private BigDecimal processSn;
	/***JOB_PROCESS_SN TABLE****/
	
	
	/***PROCESS_MST TABLE****/
	private BigDecimal processId;
	
	private String processNmEn;
	
	private String processNmKr;
	
	private String processDesc;
	/***PROCESS_MST TABLE****/
}
