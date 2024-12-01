package net.jw.twin.repository.db.dataCategoryDesc.model;

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
@Alias("dataCategoryDesc")
public class DataCategoryDesc extends BaseModel {
	@Expose
	private          String                category;// ( 1)   category                      VARCHAR(20)         category            
	@Expose
	private          String                    name;// ( 2)   name                          VARCHAR(50)         name                
	@Expose
	private          String                    icon;// ( 3)   icon                          VARCHAR(200)        icon                
	@Expose
	private            Long              iconFileId;// ( 4)   icon_file_id                  BIGINT              icon_file_id        
	@Expose
	private          String             description;// ( 5)   description                   NVARCHAR(250)       description         
}