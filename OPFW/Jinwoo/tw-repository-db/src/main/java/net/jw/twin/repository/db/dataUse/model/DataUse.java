package net.jw.twin.repository.db.dataUse.model;

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
@Alias("dataUse")
public class DataUse extends BaseModel {
	@Expose
	private            Long                      id;// ( 1)   id                            BIGINT              아이디                 
	@Expose
	private            Long                  dataId;// ( 2)   data_id                       BIGINT              데이터아이디              
	@Expose
	private          String                 purpose;// ( 3)   purpose                       VARCHAR(2000)       사용목적                
	@Expose
	private          String                  status;// ( 4)   status                        VARCHAR(20)         status              
	@Expose
	private   LocalDateTime            approvalTime;// ( 5)   approval_time                 TIMESTAMP           승인일시                
	@Expose
	private   LocalDateTime              denialTime;// ( 6)   denial_time                   TIMESTAMP           거절일시                
	@Expose
	private   LocalDateTime              expireTime;// ( 7)   expire_time                   TIMESTAMP           만료일시                
	@Expose
	private         Integer        currentCallCount;// ( 8)   current_call_count            INTEGER             current_call_count  
	@Expose
	private         Integer            maxCallCount;// ( 9)   max_call_count                INTEGER             max_call_count      
}