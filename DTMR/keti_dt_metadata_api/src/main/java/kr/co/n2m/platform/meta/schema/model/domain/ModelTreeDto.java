package kr.co.n2m.platform.meta.schema.model.domain;

import java.util.List;

import org.apache.commons.lang3.StringUtils;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

/**
 * 메타데이터 모델 트리 Dto
 * 
 * @author  n2m
 */
@Schema(description="메타데이터 모델 트리 Dto")
@Getter
@Setter
public class ModelTreeDto {
	
	private int depth;
	private String modelId;
	private String modelNm;
	private String modelLogicNm;
	private String typeModelId;
	private String typeModelNm;
	private String typeModelLogicNm;
	private String upModelId;
	private String abstrtModelYn;
	private String structdModelYn;
	private String structdModelSchmaMtcd;
	private String modelDataSttusMtcd;             
	private String[] idPath;
	private String[] nmPath;
	private String[] logicNmPath;
	private Integer[] odrgPath;	
	
	// tree 관련
	private int index;	
	private int upIndex;
	private List<ModelTreeDto> children;	
	
    @Override
    public String toString() {
    	StringBuilder sb = new StringBuilder("ModelTreeDto : ").append("upModelId=").append(upModelId).append(", modelId=").append(modelId).append(", children count=").append(children == null ? 0 : children.size());
    	if (children != null && children.size() > 0) {
    		sb.append(", children=[");
    		for (ModelTreeDto tDto : children) {
    			sb.append("\n").append(StringUtils.leftPad("", (depth + 1) * 2, " ")).append(tDto);
    		}
    		sb.append("\n").append(StringUtils.leftPad("", depth * 2, " ")).append("]\n");
    	}
        return sb.toString();
    }	
    
}
