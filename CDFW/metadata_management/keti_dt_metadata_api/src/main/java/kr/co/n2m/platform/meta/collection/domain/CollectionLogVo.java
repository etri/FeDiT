package kr.co.n2m.platform.meta.collection.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;
import org.apache.commons.lang3.builder.ReflectionToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;

import kr.co.n2m.platform.meta.architecture.domain.BaseVo;
import org.apache.ibatis.type.Alias;

@Schema(description = "메타데이터 수집 로그 정보 Vo")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Alias("collectionLogVo")
public class CollectionLogVo extends BaseVo {


    @Schema(description = "수집 로그 아이디")
    private String colecLogId;

    @Schema(description = "수집 로그 등록자 아이디")
    private String colecLogRegrId;

    @Schema(description = "수집 로그 등록자 명")
    private String colecLogRegrNm;

    @Schema(description = "수집 로그 등록 일시")
    private String colecLogRegDt;

    @Schema(description = "수집 로그 데이터")
    private String colecLogData;

    @Override
    public String toString() {
        return ReflectionToStringBuilder.toString(this, ToStringStyle.SHORT_PREFIX_STYLE, true, true);
    }
    
}
