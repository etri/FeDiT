package kr.co.n2m.platform.meta.rdf.property.mapper;

import kr.co.n2m.platform.meta.rdf.property.domain.*;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface RdfPropertyMapper {

    /** RDF 프라퍼티 목록 건수 조회 */
    int selectRdfPropertyCount(RdfPropertySearchVo rdfPropertySearchVo);

    /** RDF 프라퍼티 목록 조회 */
    List<RdfPropertyDto> selectRdfPropertyList(RdfPropertySearchVo rdfPropertySearchVo);
    
    /** RDF 프라퍼티 목록 건수 조회 (domain 모드) */
    int selectDomainRdfPropertyCount(RdfPropertySearchVo rdfPropertySearchVo);

    /** RDF 프라퍼티 목록 조회 (domain 모드) */
    List<RdfPropertyDto> selectDomainRdfPropertyList(RdfPropertySearchVo rdfPropertySearchVo);

    /** RDF 프라퍼티 상세 조회 */
    RdfPropertyDto selectRdfProperty(RdfPropertyVo rdfPropertyVo);

    /** RDF 프라퍼티 등록 */
    void insertRdfProperty(RdfPropertyVo rdfPropertyVo);

    /** RDF 프라퍼티 수정 */
    void updateRdfProperty(RdfPropertyVo rdfPropertyVo);

    /** RDF 프라퍼티 삭제 */
    void deleteRdfProperty(String rdfPrptyId);

    /******************************************** 유효성 검사 - 삭제 ******************************************** /
    /** RDF 프라퍼티 data 존재 여부 확인 - RDF property define, RDF mapping rule  */
    boolean validationDuringDeleteMode(String rdfPrptyId);

    /***************************************** 유효성 검사 - 등록 or 수정 ***************************************** /
     /** RDF 네임스페이스 ID 존재 여부 확인 - RDF namespace */
    boolean isRdfNmspIdExist(String rdfNmspId);

    /** RDF 네임스페이스,  RDF 프라퍼티명 중복 확인 */
    boolean validationDuringEditMode(RdfPropertyVo rdfPropertyVo);

    /***************************************** RDF 프로퍼티 정의 ******************************************/

    /** RDF 프로퍼티 정의 목록 추가 */
    void insertRdfPropertyDefine(RdfPropertyDefineVo rdfPropertyDefineVo);

    void insertRdfPropertyDefineBatch(List<RdfPropertyDefineVo> rdfPropertyDefineVo);

    /** RDF 프로퍼티 정의 목록 삭제 */
    void deleteRdfPropertyDefine(String rdfPrptyDefId);

    void deleteRdfPropertyDefineBatch(List<RdfPropertyDefineVo> list);

    void deleteRdfPropertyDefineByProperty(String rdfPrptyId); // rdfPrptyId 관련된 모든 정의 삭제

    /** RDF 프라퍼티 정의 목록 건수 조회 */
    int selectRdfPropertyDefineCount(RdfPropertyDefineSearchVo rdfPropertyDefineSearchVo);

    /** RDF 프라퍼티 정의 목록 조회 */
    List<RdfPropertyDefineDto> selectRdfPropertyDefineList(RdfPropertyDefineSearchVo rdfPropertyDefineSearchVo);

    /** RDF 프라퍼티 정의 상세 조회 */
    RdfPropertyDefineDto selectRdfPropertyDefine(RdfPropertyDefineSearchVo rdfPropertyDefineSearchVo);

    /***************************************** 유효성 검사 - 등록 ***************************************** /

    /** RDF 프라퍼티 ID, RDF 클래스 ID, domnRangeDivMtcd 중복 확인 */
    boolean validationDefineDuringEditMode(RdfPropertyDefineVo rdfPropertyDefineVo);

}