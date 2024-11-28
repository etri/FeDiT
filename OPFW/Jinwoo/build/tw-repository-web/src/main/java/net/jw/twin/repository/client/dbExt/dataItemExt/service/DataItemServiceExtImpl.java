package net.jw.twin.repository.client.dbExt.dataItemExt.service;

import lombok.extern.slf4j.Slf4j;
import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.UserService;
import net.jw.twin.repository.client.dbExt.dataItemExt.mapper.DataItemMapperExt;
import net.jw.twin.repository.client.dbExt.institutionExt.service.InstitutionServiceExt;
import net.jw.twin.repository.config.mybatisTypeAliasesPackage.CamelHashMap;
import net.jw.twin.repository.db.dataItem.model.DataItem;
import net.jw.twin.repository.db.dataItem.model.DataItemSearch;
import net.jw.twin.repository.db.dataItem.service.DataItemServiceAbst;
import net.jw.twin.repository.db.institution.model.Institution;
import net.jw.twin.repository.db.institution.model.InstitutionSearch;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.global.CodeValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service(value = "dataItemServiceExt")
public class DataItemServiceExtImpl extends DataItemServiceAbst<DataItemMapperExt> implements DataItemServiceExt {

    @Autowired
    @Qualifier("institutionServiceExt")
    InstitutionServiceExt institutionServiceExt;

    @Autowired
    @Qualifier("userService")
    private UserService userService;

    @Override
    @Autowired
    @Qualifier("dataItemMapperExt")
    public void setMapper(DataItemMapperExt mapper) {
        super.setMapper(mapper);
    }

    @Override
    public boolean isValid(Long id) {
        DataItemSearch search = DataItemSearch.builder()
                .id(id)
                .build();
        DataItem result = select(search);
        if (result == null) {
            return false;
        }

        if (null != result.getApprovalTime()) {
            return true;
        }

        return false;
    }

    @Override
    @Transactional
    public void requestDataRegist(DataItem dataItem) {
        Long userId = getUserId();
        dataItem = dataItem.toBuilder()
                .status(CodeValue.DataItemStatus.waiting.name())
                .regId(userId)
                .regDt(LocalDateTime.now())
                .build();
        insert(dataItem);
    }

    @Override
    @Transactional
    public Map<String, Object> selectDataDetail(DataItemSearch search) {
        CamelHashMap dataDetail = (CamelHashMap)mapper.selectDataDetail(search);

        Long institutionId = (Long) dataDetail.get("institutionId");
        if (null != institutionId) {
            try {
                InstitutionSearch institutionSearch = InstitutionSearch.builder()
                        .id(institutionId)
                        .build();
                Institution institution = Optional.ofNullable(institutionServiceExt.select(institutionSearch))
                        .orElseThrow(() -> new CustomException(ErrorStatus.E_DB__NOT_FOUND, "institution 정보가 없습니다. id : " + institutionId));

                dataDetail.putWithoutNamingConversion("institutionName", institution.getName());

                Long managerUserId = institution.getManagerUserId();
                if (null != managerUserId) {
                    UserSearch userSearch = UserSearch.builder()
                            .userId(managerUserId)
                            .build();

                    User managerUser = userService.select(userSearch);
                    dataDetail.putWithoutNamingConversion("managerName", managerUser.getUserNm());
                    dataDetail.putWithoutNamingConversion("managerPhoneNumber", managerUser.getMobile());
                }
            }catch(Exception e){
                log.error("failed to get data detail. {}", e.getMessage());
            }
        }

        return dataDetail;
    }

    @Override
    public int countDataDetail(DataItemSearch search) {
        return mapper.countDataDetail(search);
    }

    @Override
    public List<Map<String, Object>> selectListDataDetail(DataItemSearch search){
        List<Map<String, Object>> dataDetailList = mapper.selectListDataDetail(search);

        for (Map<String, Object> dataDetailItem : dataDetailList) {
            Long dataItemId = null;
            CamelHashMap camelHashMap = null;
            try {
                camelHashMap = (CamelHashMap) dataDetailItem;
                dataItemId = (Long)camelHashMap.get("id");
            } catch ( Exception e ) {
                log.error("failed to get data detail item. message : {}", e.getMessage());
                continue;
            }

            try {
                Long institutionId = (Long) camelHashMap.get("institutionId");
                if (null != institutionId) {
                    InstitutionSearch institutionSearch = InstitutionSearch.builder()
                            .id(institutionId)
                            .build();
                    Institution institution = Optional.ofNullable(institutionServiceExt.select(institutionSearch))
                            .orElseThrow(() -> new CustomException(ErrorStatus.E_DB__NOT_FOUND, "institution 정보가 없습니다. id : " + institutionId));

                    camelHashMap.putWithoutNamingConversion("institutionName", institution.getName());

                    Long managerUserId = institution.getManagerUserId();
                    if (null != managerUserId) {
                        UserSearch userSearch = UserSearch.builder()
                                .userId(managerUserId)
                                .build();

                        User managerUser = userService.select(userSearch);
                        camelHashMap.putWithoutNamingConversion("managerName", managerUser.getUserNm());
                        camelHashMap.putWithoutNamingConversion("managerPhoneNumber", managerUser.getMobile());
                    }
                }
            } catch ( Exception e ) {
                log.error("failed to prepare data detail item. item id : {} , message : {}", dataItemId, e.getMessage());
            }
        }
        return dataDetailList;
    }
}
