package net.jw.twin.repository.db.restKey.model;

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
@Alias("restKey")
public class RestKey extends BaseModel {
	@Expose
	private            Long                      id;// ( 1)   id                            BIGINT              아이디                 
	@Expose
	private            Long                  userId;// ( 2)   user_id                       BIGINT              user_id             
	@Expose
	private          String                   token;// ( 3)   token                         VARCHAR(255)        token               
	@Expose
	private          String                  status;// ( 4)   status                        VARCHAR(20)         status              
	@Expose
	private   LocalDateTime               issueTime;// ( 5)   issue_time                    TIMESTAMP           발급일시                
	@Expose
	private   LocalDateTime              expireTime;// ( 6)   expire_time                   TIMESTAMP           만료일시                
}