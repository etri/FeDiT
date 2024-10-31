package net.jw.twin.repository.db.dataItem.model;

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
@Alias("dataItem")
public class DataItem extends BaseModel {
	@Expose
	private            Long                      id;// ( 1)   id                            BIGINT              id                  
	@Expose
	private          String                    type;// ( 2)   type                          VARCHAR(20)         type                
	@Expose
	private          String                    name;// ( 3)   name                          VARCHAR(50)         name                
	@Expose
	private          String                category;// ( 4)   category                      VARCHAR(20)         분류                  
	@Expose
	private          String                dataCode;// ( 5)   data_code                     VARCHAR(20)         데이터코드               
	@Expose
	private          String                  status;// ( 6)   status                        VARCHAR(20)         status              
	@Expose
	private          String          swaggerTagList;// ( 7)   swagger_tag_list              VARCHAR(2000)       swagger_tag_list    
	@Expose
	private          String                 apiType;// ( 8)   api_type                      VARCHAR(20)         api_type            
	@Expose
	private          String              dataFormat;// ( 9)   data_format                   VARCHAR(20)         data_format         
	@Expose
	private          String               serviceId;// (10)   service_id                    NVARCHAR(50)        service_id          
	@Expose
	private          String             externalUrl;// (11)   external_url                  VARCHAR(200)        external_url        
	@Expose
	private          String                 restUrl;// (12)   rest_url                      VARCHAR(200)        rest_url            
	@Expose
	private          String                  restIp;// (13)   rest_ip                       VARCHAR(200)        rest_ip             
	@Expose
	private         Integer                restPort;// (14)   rest_port                     SMALLINT UNSIGNED   rest_port           
	@Expose
	private          String              swaggerUrl;// (15)   swagger_url                   VARCHAR(200)        swagger_url         
	@Expose
	private          String         swaggerHomepath;// (16)   swagger_homepath              NVARCHAR(50)        swagger_homepath    
	@Expose
	private          String                provider;// (17)   provider                      VARCHAR(50)         provider            
	@Expose
	private            Long           institutionId;// (18)   institution_id                BIGINT              institution_id      
	@Expose
	private          String                 manager;// (19)   manager                       VARCHAR(50)         manager             
	@Expose
	private          String      managerPhoneNumber;// (20)   manager_phone_number          VARCHAR(30)         manager_phone_number
	@Expose
	private          String             description;// (21)   description                   VARCHAR(2000)       description         
	@Expose
	private   LocalDateTime            approvalTime;// (22)   approval_time                 TIMESTAMP           승인일시                
	@Expose
	private   LocalDateTime              denialTime;// (23)   denial_time                   TIMESTAMP           거절일시                
	@Expose
	private   LocalDateTime          deprecatedTime;// (24)   deprecated_time               TIMESTAMP           사용정지일시              
	@Expose
	private         Integer        currentCallCount;// (25)   current_call_count            INTEGER             current_call_count  
	@Expose
	private         Integer            maxCallCount;// (26)   max_call_count                INTEGER             max_call_count      
}