package kr.co.e8ight.auth.entity.common;

import lombok.Data;

import javax.persistence.Embeddable;

@Embeddable
@Data
public class Address {

	private String zipcode;
	
	private String addr1;
	
	private String addr2;

}