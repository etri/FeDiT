package kr.co.n2m.platform.meta.search.vector.domain;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

import org.apache.commons.collections4.map.ListOrderedMap;

import com.fasterxml.jackson.annotation.JsonInclude;

import io.swagger.v3.oas.annotations.media.Schema;
import kr.co.n2m.platform.meta.architecture.code.MetadataEnum.MetadataSetRangeModelId;
import kr.co.n2m.platform.meta.architecture.domain.CamelCaseMap;
import kr.co.n2m.platform.meta.architecture.util.JsonUtil;
import kr.co.n2m.platform.meta.resource.metadata.domain.MetadataVo;
import kr.co.n2m.platform.meta.schema.model.domain.ModelInfoDto;
import kr.co.n2m.platform.meta.schema.modelproperty.domain.ModelPropertyInfoDto;
import lombok.Getter;
import lombok.Setter;

@Schema(description="Vector 저장용 Dto")
@JsonInclude(JsonInclude.Include.NON_NULL)
@Getter
@Setter
public class VectorStoreDto {
	
    private String id;
	
    @NotBlank private String metaTypeModel;   // 예: DigitalTwin, Sensor ...
    @NotBlank private String metaModel;       // 예: SingleDigitalTwin, Simulation ...
    private String metaTypeModelIdField;

    @NotBlank private String name;
    @Size(max=20000) private String description;

    private List<@NotBlank String> subjects;
    private List<@NotBlank String> keywords;

    private String owner;
    private String creator;
    
    // 메타데이터 상태 (필요없을 수 있음)
    private String statusCode;
    private String statusName;

    // ISO8601 + 오프셋 권장 (예: 2025-09-17T11:00:00+09:00)
    private String creationTime;
    private String modificationTime;

    private String countryCode;
    private String classificationTypeCode;
    private String classificationCode;

    // GeoJSON
    private Map<String, Object> geometry;
    private Map<String, Object> geometryCentroid;

    // 서버가 content를 생성하지만, 커스텀하고 싶으면 이걸로 덮어쓰기
    private String embeddingText;

    // 관계(필수 아님)
    private List<CamelCaseMap> upSetList;
    private Boolean pruneUp = true;
    private List<Map<String,Object>> edgeList;
    private Boolean pruneDown = false;

    // 확장 필드(유형별/실험용)
    private Map<String, Object> customFields;
    
    
    private static final java.util.Set<String> BASE_KEYS = java.util.Set.of(
    	"metaTypeModel", "metaModel", "name", "description"
    	, "subjects", "keywords"
        , "owner", "creator", "statusCode", "statusName", "creationTime", "modificationTime"
        , "countryCode", "classificationTypeCode", "classificationCode"
    );
    
    public VectorStoreDto() { }
    
    /**
     * 벡터 데이터
     * @param medataSetId
     * @param map
     * @param modelInfoDto
     * @param downList
     * @param upSetList
     * @param geoInfo
     */
    @SuppressWarnings("rawtypes")
	public VectorStoreDto(String medataSetId, ListOrderedMap<String, Object> map, ModelInfoDto modelInfoDto, List<MetadataVo> downList, List<CamelCaseMap> upSetList, Map geoInfo) {
    	this.id 				= medataSetId;
        this.metaTypeModel 		= (String) map.get("metaTypeModel");
        this.metaModel     		= (String) map.get("metaModel");
        this.name          		= (String) map.get("name");
        this.description 		= (String) map.get("description");
        this.subjects 			= toStringList(map.get("subjects"));
        this.keywords 			= toStringList(map.get("keywords"));
        this.owner            	= (String) map.get("owner");
        this.creator          	= (String) map.get("creator");
        this.statusCode       	= (String) map.get("statusCode");
        this.statusName       	= (String) map.get("statusName");
        this.creationTime     	= (String) map.get("creationTime");
        this.modificationTime 	= (String) map.get("modificationTime");
        this.countryCode             = (String) map.get("countryCode");
        this.classificationTypeCode  = (String) map.get("classificationTypeCode");
        this.classificationCode      = (String) map.get("classificationCode");
        
        this.metaTypeModelIdField    = modelInfoDto.getSetIdPropertyNm();
        
        List<Map<String,Object>> edgeList = new ArrayList<>();
        Map<String, Object> customFields = new HashMap<>();
        
        // entity
        for (Object ent : map.entrySet()) {
            Map.Entry entry = (Map.Entry) ent;
            String prptyNm = String.valueOf(entry.getKey()); // key : prptyNm
            Object val = entry.getValue();

            if (BASE_KEYS.contains(prptyNm)) continue;

            ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(prptyNm);
            if (pDto == null) continue;
            
            // down 관계 -> downList 로 함.
            if ("object_type".equals(pDto.getRangeModelTypeMtcd())) continue;
                        
            // 식별체계 관련
            if (MetadataSetRangeModelId.idSchmCountryCode.code().equals(pDto.getRangeModelId())) {
            	this.countryCode = (String) map.get(prptyNm);
            	customFields.put(prptyNm, val);
            	continue;
            }
            if (MetadataSetRangeModelId.idSchmType.code().equals(pDto.getRangeModelId())) {
            	this.classificationTypeCode = (String) map.get(prptyNm);
            	customFields.put(prptyNm, val);
            	continue;
            }
            if (MetadataSetRangeModelId.idSchmCode.code().equals(pDto.getRangeModelId())) {
            	this.classificationCode = (String) map.get(prptyNm);
            	customFields.put(prptyNm, val);
            	continue;
            }
            if (MetadataSetRangeModelId.idSchmCode2.code().equals(pDto.getRangeModelId())) {
            	customFields.put(prptyNm, val);
            	continue;
            }            
            
            // customFields
            customFields.put(prptyNm, val);
            
            if (customFields.size() > 0) {
            	this.customFields = customFields;
            }
        }
        
        // down 관계
        if (downList != null && downList.size() > 0) {
        	// 다운 리스트는 typeModel 이 문제.. 어케 할까??? 따로 조회해?? ㅠㅠ!!!
        	for (MetadataVo tVo: downList) {
        		ModelPropertyInfoDto pDto = modelInfoDto.getPropertyInfoDto(tVo.getPrptyId()); // prptyId = prptyNm
            	Map<String,Object> edgeMap = Map.of(
            	    "prptyNm", tVo.getPrptyId(),
                    "targetId", tVo.getMedataVal(),
                    "targetMetaTypeModel", pDto.getRangeTypeModelId(),
                    "targetMetaModel", tVo.getValModelId()
                );
            	edgeList.add(edgeMap);
        	}
            if (edgeList.size() > 0) {
            	this.edgeList = edgeList;
            }        	
        }
        // up 관계
		if (upSetList != null && upSetList.size() > 0) {
			this.upSetList = upSetList;
		}
		// geometry 정보
		if (geoInfo != null && !geoInfo.isEmpty()) {
			this.geometry = JsonUtil.toMap((String) geoInfo.get("geometry"));
			this.geometryCentroid = JsonUtil.toMap((String) geoInfo.get("geometryCentroid"));
		}
    }
    
    private static List<String> toStringList(Object v) {
        if (v == null) return null;
        if (v instanceof List<?>) {
            List<String> out = new java.util.ArrayList<>();
            for (Object o : (List<?>) v) if (o != null) out.add(String.valueOf(o));
            return out.isEmpty() ? null : out;
        }
        if (v instanceof String) {
            String s = ((String) v).trim();
            return s.isEmpty() ? null : java.util.Collections.singletonList(s);
        }
        return java.util.Collections.singletonList(String.valueOf(v));
    }

}
