package net.jw.twin.repository.db.daemon.model;

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
@Alias("daemon")
public class Daemon extends BaseModel {
	@Expose
	private            Long                      id;// ( 1)   id                            BIGINT              아이디                 
	@Expose
	private          String                   dtype;// ( 2)   dtype                         VARCHAR(20)         dtype               
	@Expose
	private          String                    name;// ( 3)   name                          VARCHAR(200)        name                
	@Expose
	private          String                   label;// ( 4)   label                         VARCHAR(200)        label               
	@Expose
	private         Boolean         useMetricMemory;// ( 5)   use_metric_memory             TINYINT(1)          use_metric_memory   
	@Expose
	private          String             cronPattern;// ( 6)   cron_pattern                  VARCHAR(20)         cron_pattern        
	@Expose
	private          String                  apiUrl;// ( 7)   api_url                       VARCHAR(200)        api_url             
	//NotExpose
	@Schema(hidden = true)
	private    List<Object>                  values;// ( 8)   values                        @NotDb              values              
}