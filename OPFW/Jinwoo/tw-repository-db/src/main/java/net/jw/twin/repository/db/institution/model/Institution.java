package net.jw.twin.repository.db.institution.model;

import com.google.gson.annotations.Expose;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import lombok.experimental.SuperBuilder;
import net.jcms.framework.base.model.BaseModel;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import java.math.BigDecimal;

import org.apache.ibatis.type.Alias;

@Getter
@Setter
@SuperBuilder(toBuilder=true)
@NoArgsConstructor
@ToString
@Alias("institution")
public class Institution extends BaseModel {
	@Expose
	private            Long                      id;// ( 1)   id                            BIGINT              id                  
	@Expose
	private          String                    name;// ( 2)   name                          VARCHAR(50)         이름                  
	@Expose
	private            Long           managerUserId;// ( 3)   manager_user_id               BIGINT              관리자                 
	@Expose
	private          String                 address;// ( 4)   address                       VARCHAR(255)        주소                  
	@Expose
	private          String           addressDetail;// ( 5)   address_detail                VARCHAR(255)        상세주소                
	@Expose
	private          String                 zipCode;// ( 6)   zip_code                      VARCHAR(12)         우편번호                
	@Expose
	private          String             phoneNumber;// ( 7)   phone_number                  VARCHAR(30)         전화번호                
}