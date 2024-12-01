package net.jw.twin.repository.client.dbExt.institutionExt.service;

import net.jcms.framework.security.model.User;
import net.jcms.framework.security.model.UserRole;
import net.jcms.framework.security.model.UserRoleSearch;
import net.jcms.framework.security.model.UserSearch;
import net.jcms.framework.security.service.UserRoleService;
import net.jcms.framework.security.service.UserService;
import net.jw.twin.repository.client.dbExt.institutionExt.mapper.InstitutionMapperExt;
import net.jw.twin.repository.db.institution.model.Institution;
import net.jw.twin.repository.db.institution.model.InstitutionSearch;
import net.jw.twin.repository.db.institution.service.InstitutionServiceAbst;
import net.jw.twin.repository.exception.CustomException;
import net.jw.twin.repository.exception.ErrorStatus;
import net.jw.twin.repository.global.CodeValue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service(value="institutionServiceExt")
public class InstitutionServiceExtImpl extends InstitutionServiceAbst<InstitutionMapperExt> implements InstitutionServiceExt {

    @Autowired
    @Qualifier("userService")
    UserService userService;

    @Autowired
    @Qualifier("userRoleService")
    private UserRoleService userRoleService;

    @Autowired
    @Qualifier("institutionServiceExt")
    InstitutionServiceExt institutionServiceExt;

    @Override
    @Autowired
    @Qualifier("institutionMapperExt")
    public void setMapper(InstitutionMapperExt institutionMapper) {
        super.setMapper(institutionMapper);
    }

    @Override
    public List<Map<String, Object>> selectListWithManagerName(InstitutionSearch search) {
        return mapper.selectListWithManagerName(search);
    }

    @Override
    @Transactional
    public void updateInstitution(Institution institution) {
        Institution prevInstitution = select(InstitutionSearch.builder().id(institution.getId()).build());
        if (prevInstitution == null) {
            throw new CustomException(ErrorStatus.E_DB__FAIL_SELECT, "institution not found. institution id:" + institution.getId());
        }

        Long prevManagerUserId = prevInstitution.getManagerUserId();
        if(null != prevManagerUserId) {
            User prevManagerUser = userService.select(UserSearch.builder().userId(prevManagerUserId).build());
            if(null == prevManagerUser) {
                throw new CustomException(ErrorStatus.E_DB__FAIL_SELECT, "prevManagerUser not found. user id:" + prevManagerUserId);
            }

            UserRoleSearch userRoleSearch = UserRoleSearch.builder()
                                                            .userId(prevManagerUser.getUserId())
                                                            .build();
            UserRole prevUserRole = userRoleService.select(userRoleSearch);
            if(null == prevUserRole) {
                throw new CustomException(ErrorStatus.E_DB__FAIL_SELECT, "prevManagerUser userRole not found. user id:" + prevManagerUserId);
            }

            if(prevUserRole.getRoleAuth().equals(CodeValue.ROLE_AUTH.ROLE_MEMBER_ADMIN.toString())){
                UserRole userRole = UserRole.builder()
                        .userId(prevManagerUser.getUserId())
                        .roleAuth(CodeValue.ROLE_AUTH.ROLE_MEMBER.toString())
                        .build();

                userRoleService.update(userRole);
            }
        }

        Long newManagerUserId = institution.getManagerUserId();
        User newManagerUser = userService.select(UserSearch.builder().userId(newManagerUserId).build());
        if(null == newManagerUser) {
            throw new CustomException(ErrorStatus.E_DB__FAIL_SELECT, "newManagerUser not found. user id:" + newManagerUserId);
        }

        UserRoleSearch userRoleSearch = UserRoleSearch.builder()
                .userId(newManagerUser.getUserId())
                .build();
        UserRole newManagerUserRole = userRoleService.select(userRoleSearch);
        if(null == newManagerUserRole) {
            throw new CustomException(ErrorStatus.E_DB__FAIL_SELECT, "newManagerUserRole userRole not found. user id:" + newManagerUser.getUserId());
        }

        if( !newManagerUserRole.getRoleAuth().equals(CodeValue.ROLE_AUTH.ROLE_MEMBER.toString()) ) {
            throw new CustomException(ErrorStatus.E_DB__FAIL_SELECT, "newManagerUserRole userRole is not member. user id:" + newManagerUser.getUserId());
        }

        newManagerUserRole.setRoleAuth(CodeValue.ROLE_AUTH.ROLE_MEMBER_ADMIN.toString());
        userRoleService.update(newManagerUserRole);

        int count = institutionServiceExt.update(institution);
        if(count != 1){
            throw new CustomException(ErrorStatus.E_DB__FAIL_INSERT, "institution id : " + institution.getId());
        }
    }
}
