package kr.co.e8ight.auth.dto;


import io.swagger.v3.oas.annotations.media.Schema;

import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.PrePersist;
import javax.persistence.Transient;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Embeddable
public class RegistrationDto {
	
	public RegistrationDto() {
		
	}
	
	public RegistrationDto(Integer regId) {
		this.regId = regId;
		this.regDt = LocalDateTime.now();
	}

	@Column(name="reg_id" , updatable=false)
	private Integer regId;
	
	@Column(name="reg_dt" , updatable=false)
	private LocalDateTime regDt;

	@Transient
	@Schema(hidden= true)
	private String regDay;	
	
	@Transient
	public String getRegDay() {
		if(regDt == null) return null;
		return regDt.format(DateTimeFormatter.ofPattern("yyyy.MM.dd"));
	}

	@PrePersist
	protected void onPersist() {
	  this.regDt = 	LocalDateTime.now();
	}


	public Integer getRegId() {
		return regId;
	}

	public LocalDateTime getRegDt() {
		return regDt;
	}
}
