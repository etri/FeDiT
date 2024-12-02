package net.jw.twin.tw_service_manager.rest.springDoc.schema;

import com.google.gson.annotations.Expose;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class Response200List<T> {
    @Expose
    @Schema(description = "응답 데이터 리스트")
    private List<T> list;
    @Expose
    @Schema(description = "응답받은 현재 페이지 넘버", example = "1")
    private Integer pageNumber;
    @Expose
    @Schema(description = "응답받은현재 페이지에서의 row 개수", example = "10")
    private Integer numberOfRows;
    @Expose
    @Schema(description = "조건에 맞게 검색된 전체 데이터 개수", example = "30")
    private Integer totalCount;
}
