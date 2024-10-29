package kr.co.n2m.platform.admin.feature.common.entity;

import org.apache.ibatis.type.Alias;

/**
 * The Class ContactVO.
 * @author (주)엔투엠
 */
@Alias("userVO")
public class ContactVO extends BaseVO {

	/** The Constant serialVersionUID. */
	private static final long serialVersionUID = -731791336945925684L;

	/** 사용자 ID. */
	private String contactID;

	/** 신사번. */
	private String newRepID;

	/** 구사번. */
	private String oldRepID;

	/** The user id. */
	private String userId;
	
	/** The user password */
	private String password;

	/** The first name. */
	private String firstName;

	/** The last name. */
	private String lastName;

	/** 사용자 명. */
	private String fullName;

	/** 사용자 영문명. */
	private String fullEngName;

	/** HP SM ID. */
	private String operatorID;

	/** 회사. */
	private String companyID;
	
	/** The org company id. */
	private String orgCompanyID;

	/** 회사 명. */
	private String companyName;

	/** 부서 ID. */
	private String deptID;

	/** 부서 명. */
	private String deptName;

	/** 전화번호. */
	private String phone;

	/** 모바일번호. */
	private String portablePhone;

	/** 팩스번호. */
	private String fax;

	/** 이메일. */
	private String email;

	/** 주소 1. */
	private String address1;

	/** 주소 2. */
	private String address2;

	/** 주소 3. */
	private String address3;

	/** 주소 4. */
	private String address4;

	/** 우편번호. */
	private String zipCode;

	/** 직책. */
	private String positionID;

    /** 직책 명. */
    private String positionName;

	/** 직위. */
	private String titleID;

	/** 직위 명. */
	private String titleName;

	/** 사용자 타입. */
	private String userType;

	/** 사용자 타입. */
	private String userStatus;

	/** 협력사 타입. */
	private String partnerType;

	/** 사업자등록번호. */
	private String bizNo;

	/** 등록일시. */
	private String regDate;

	/**  협력사 여부. */
	private String ktdsCorpYN;

	/** NSTEP 조직 코드. */
	private String nstepDeptID;

	/** NSTEP 조직명. */
	private String nstepDeptName;

	/**  협력사 여부. */
	private String ktKtdsCorp;

	/** 작업그룹 ID. */
    private String wogID;

    /** 작업그룹 명. */
    private String wogName;

	/** 소속 회사. */
	private String ownedCompany;

	/** SMS 수신여부 */
	private String smsReceiveCheck;

	/** Default 포탈 */
	private String zDefaultportal;

	/** email 수신여부 */
	private String emailReceiveCheck;
	
	/** The default portal cod id. */
	private String defaultPortalCodID;
	
	/** The default portal cod name. */
	private String defaultPortalCodName;
	
	/** 사용자유형 명. */
	private String partnerTypeName;
	
	/** 운영자 여부. */
	private int operatorYN = 0;
		
	/** 포함 보안그룹 문자열. */
	private String includeSecuGroups;
	
	/** 제외 보안그룹 문자열. */
	private String excludeSecuGroups;	
	
	/** 인시던트공지그룹용 관리자 contactID. */
	private String igmContactID;
	
	/** 인시던트공지그룹용 공지 OID. */
	private String igmIngOid;
	
	/** 기타 **/
	private String etc;
	
	/** 부서 OID **/
	private String deptOid;

	/** 회사 OID **/
	private String companyOid;
	
	private int rnum;
	
    /**
     * Gets the contact id.
     *
     * @return the contact id
     */
    public String getContactID() {
        return contactID;
    }

    /**
     * Sets the contact id.
     *
     * @param contactID the new contact id
     */
    public void setContactID(String contactID) {
        this.contactID = contactID;
    }

    /**
     * Gets the new rep id.
     *
     * @return the new rep id
     */
    public String getNewRepID() {
        return newRepID;
    }

    /**
     * Sets the new rep id.
     *
     * @param newRepID the new new rep id
     */
    public void setNewRepID(String newRepID) {
        this.newRepID = newRepID;
    }

    /**
     * Gets the old rep id.
     *
     * @return the old rep id
     */
    public String getOldRepID() {
        return oldRepID;
    }

    /**
     * Sets the old rep id.
     *
     * @param oldRepID the new old rep id
     */
    public void setOldRepID(String oldRepID) {
        this.oldRepID = oldRepID;
    }

    /**
     * Gets the user id.
     *
     * @return the user id
     */
    public String getUserId() {
        return userId;
    }

    /**
     * Sets the user id.
     *
     * @param userID the new user id
     */
    public void setUserId(String userId) {
        this.userId = userId;
    }

    /**
     * Gets the first name.
     *
     * @return the first name
     */
    public String getFirstName() {
        return firstName;
    }

    /**
     * Sets the first name.
     *
     * @param firstName the new first name
     */
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    /**
     * Gets the last name.
     *
     * @return the last name
     */
    public String getLastName() {
        return lastName;
    }

    /**
     * Sets the last name.
     *
     * @param lastName the new last name
     */
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    /**
     * Gets the full name.
     *
     * @return the full name
     */
    public String getFullName() {
        return fullName;
    }

    /**
     * Sets the full name.
     *
     * @param fullName the new full name
     */
    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    /**
     * Gets the full eng name.
     *
     * @return the full eng name
     */
    public String getFullEngName() {
        return fullEngName;
    }

    /**
     * Sets the full eng name.
     *
     * @param fullEngName the new full eng name
     */
    public void setFullEngName(String fullEngName) {
        this.fullEngName = fullEngName;
    }

    /**
     * Gets the operator id.
     *
     * @return the operator id
     */
    public String getOperatorID() {
        return operatorID;
    }

    /**
     * Sets the operator id.
     *
     * @param operatorID the new operator id
     */
    public void setOperatorID(String operatorID) {
        this.operatorID = operatorID;
    }

    /**
     * Gets the company id.
     *
     * @return the company id
     */
    public String getCompanyID() {
        return companyID;
    }

    /**
     * Sets the company id.
     *
     * @param companyID the new company id
     */
    public void setCompanyID(String companyID) {
        this.companyID = companyID;
    }
    
    /**
     * Gets the org company id.
     *
     * @return the org company id
     */
    public String getOrgCompanyID() {
        return orgCompanyID;
    }

    /**
     * Sets the org company id.
     *
     * @param orgCompanyID the new org company id
     */
    public void setOrgCompanyID(String orgCompanyID) {
        this.orgCompanyID = orgCompanyID;
    }

    /**
     * Gets the company name.
     *
     * @return the company name
     */
    public String getCompanyName() {
        return companyName;
    }

    /**
     * Sets the company name.
     *
     * @param companyName the new company name
     */
    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    /**
     * Gets the dept id.
     *
     * @return the dept id
     */
    public String getDeptID() {
        return deptID;
    }

    /**
     * Sets the dept id.
     *
     * @param deptID the new dept id
     */
    public void setDeptID(String deptID) {
        this.deptID = deptID;
    }

    /**
     * Gets the dept name.
     *
     * @return the dept name
     */
    public String getDeptName() {
        return deptName;
    }

    /**
     * Sets the dept name.
     *
     * @param deptName the new dept name
     */
    public void setDeptName(String deptName) {
        this.deptName = deptName;
    }

    /**
     * Gets the phone.
     *
     * @return the phone
     */
    public String getPhone() {
        return phone;
    }

    /**
     * Sets the phone.
     *
     * @param phone the new phone
     */
    public void setPhone(String phone) {
        this.phone = phone;
    }

    /**
     * Gets the portable phone.
     *
     * @return the portable phone
     */
    public String getPortablePhone() {
        return portablePhone;
    }

    /**
     * Sets the portable phone.
     *
     * @param portablePhone the new portable phone
     */
    public void setPortablePhone(String portablePhone) {
        this.portablePhone = portablePhone;
    }

    /**
     * Gets the fax.
     *
     * @return the fax
     */
    public String getFax() {
        return fax;
    }

    /**
     * Sets the fax.
     *
     * @param fax the new fax
     */
    public void setFax(String fax) {
        this.fax = fax;
    }

    /**
     * Gets the email.
     *
     * @return the email
     */
    public String getEmail() {
        return email;
    }

    /**
     * Sets the email.
     *
     * @param email the new email
     */
    public void setEmail(String email) {
        this.email = email;
    }

    /**
     * Gets the address1.
     *
     * @return the address1
     */
    public String getAddress1() {
        return address1;
    }

    /**
     * Sets the address1.
     *
     * @param address1 the new address1
     */
    public void setAddress1(String address1) {
        this.address1 = address1;
    }

    /**
     * Gets the address2.
     *
     * @return the address2
     */
    public String getAddress2() {
        return address2;
    }

    /**
     * Sets the address2.
     *
     * @param address2 the new address2
     */
    public void setAddress2(String address2) {
        this.address2 = address2;
    }

    /**
     * Gets the address3.
     *
     * @return the address3
     */
    public String getAddress3() {
        return address3;
    }

    /**
     * Sets the address3.
     *
     * @param address3 the new address3
     */
    public void setAddress3(String address3) {
        this.address3 = address3;
    }

    /**
     * Gets the address4.
     *
     * @return the address4
     */
    public String getAddress4() {
        return address4;
    }

    /**
     * Sets the address4.
     *
     * @param address4 the new address4
     */
    public void setAddress4(String address4) {
        this.address4 = address4;
    }

    /**
     * Gets the zip code.
     *
     * @return the zip code
     */
    public String getZipCode() {
        return zipCode;
    }

    /**
     * Sets the zip code.
     *
     * @param zipCode the new zip code
     */
    public void setZipCode(String zipCode) {
        this.zipCode = zipCode;
    }

    /**
     * Gets the position id.
     *
     * @return the position id
     */
    public String getPositionID() {
        return positionID;
    }

    /**
     * Sets the position id.
     *
     * @param positionID the new position id
     */
    public void setPositionID(String positionID) {
        this.positionID = positionID;
    }

    /**
     * Gets the position name.
     *
     * @return the position name
     */
    public String getPositionName() {
        return positionName;
    }

    /**
     * Sets the position name.
     *
     * @param positionName the new position name
     */
    public void setPositionName(String positionName) {
        this.positionName = positionName;
    }

    /**
     * Gets the title id.
     *
     * @return the title id
     */
    public String getTitleID() {
        return titleID;
    }

    /**
     * Sets the title id.
     *
     * @param titleID the new title id
     */
    public void setTitleID(String titleID) {
        this.titleID = titleID;
    }

    /**
     * Gets the title name.
     *
     * @return the title name
     */
    public String getTitleName() {
        return titleName;
    }

    /**
     * Sets the title name.
     *
     * @param titleName the new title name
     */
    public void setTitleName(String titleName) {
        this.titleName = titleName;
    }

    /**
     * Gets the user type.
     *
     * @return the user type
     */
    public String getUserType() {
        return userType;
    }

    /**
     * Sets the user type.
     *
     * @param userType the new user type
     */
    public void setUserType(String userType) {
        this.userType = userType;
    }

    /**
     * Gets the user status.
     *
     * @return the userStatus
     */
    public String getUserStatus() {
        return userStatus;
    }

    /**
     * Sets the user status.
     *
     * @param userStatus the userStatus to set
     */
    public void setUserStatus(String userStatus) {
        this.userStatus = userStatus;
    }

    /**
     * Gets the partner type.
     *
     * @return the partner type
     */
    public String getPartnerType() {
        return partnerType;
    }

    /**
     * Sets the partner type.
     *
     * @param partnerType the new partner type
     */
    public void setPartnerType(String partnerType) {
        this.partnerType = partnerType;
    }

    /**
     * Gets the biz no.
     *
     * @return the biz no
     */
    public String getBizNo() {
        return bizNo;
    }

    /**
     * Sets the biz no.
     *
     * @param bizNo the new biz no
     */
    public void setBizNo(String bizNo) {
        this.bizNo = bizNo;
    }

    /**
     * Gets the reg date.
     *
     * @return the reg date
     */
    public String getRegDate() {
        return regDate;
    }

    /**
     * Sets the reg date.
     *
     * @param regDate the new reg date
     */
    public void setRegDate(String regDate) {
        this.regDate = regDate;
    }

    /**
     * Gets the ktds corp yn.
     *
     * @return the ktds corp yn
     */
    public String getKtdsCorpYN() {
        return ktdsCorpYN;
    }

    /**
     * Sets the ktds corp yn.
     *
     * @param ktdsCorpYN the new ktds corp yn
     */
    public void setKtdsCorpYN(String ktdsCorpYN) {
        this.ktdsCorpYN = ktdsCorpYN;
    }

    /**
     * Gets the nstep dept id.
     *
     * @return the nstepDeptID
     */
    public String getNstepDeptID() {
        return nstepDeptID;
    }

    /**
     * Sets the nstep dept id.
     *
     * @param nstepDeptID the nstepDeptID to set
     */
    public void setNstepDeptID(String nstepDeptID) {
        this.nstepDeptID = nstepDeptID;
    }

    /**
     * Gets the nstep dept name.
     *
     * @return the nstepDeptName
     */
    public String getNstepDeptName() {
        return nstepDeptName;
    }

    /**
     * Sets the nstep dept name.
     *
     * @param nstepDeptName the nstepDeptName to set
     */
    public void setNstepDeptName(String nstepDeptName) {
        this.nstepDeptName = nstepDeptName;
    }

    /**
     * Gets the kt ktds corp.
     *
     * @return the ktKtdsCorp
     */
    public String getKtKtdsCorp() {
        return ktKtdsCorp;
    }

    /**
     * Sets the kt ktds corp.
     *
     * @param ktKtdsCorp the ktKtdsCorp to set
     */
    public void setKtKtdsCorp(String ktKtdsCorp) {
        this.ktKtdsCorp = ktKtdsCorp;
    }

    /**
     * Gets the wog id.
     *
     * @return the wog id
     */
    public String getWogID() {
        return wogID;
    }

    /**
     * Sets the wog id.
     *
     * @param wogID the new wog id
     */
    public void setWogID(String wogID) {
        this.wogID = wogID;
    }

    /**
     * Gets the wog name.
     *
     * @return the wog name
     */
    public String getWogName() {
        return wogName;
    }

    /**
     * Sets the wog name.
     *
     * @param wogName the new wog name
     */
    public void setWogName(String wogName) {
        this.wogName = wogName;
    }

	/**
	 * @return the ownedCompany
	 */
	public String getOwnedCompany() {
		return ownedCompany;
	}

	/**
	 * @param ownedCompany the ownedCompany to set
	 */
	public void setOwnedCompany(String ownedCompany) {
		this.ownedCompany = ownedCompany;
	}

	/**
	 * @return the smsReceiveCheck
	 */
	public String getSmsReceiveCheck() {
		return smsReceiveCheck;
	}

	/**
	 * @param smsReceiveCheck the smsReceiveCheck to set
	 */
	public void setSmsReceiveCheck(String smsReceiveCheck) {
		this.smsReceiveCheck = smsReceiveCheck;
	}

	/**
	 * @return the zDefaultportal
	 */
	public String getzDefaultportal() {
		return zDefaultportal;
	}

	/**
	 * @param zDefaultportal the zDefaultportal to set
	 */
	public void setzDefaultportal(String zDefaultportal) {
		this.zDefaultportal = zDefaultportal;
	}

	/**
	 * @return the emailReceiveCheck
	 */
	public String getEmailReceiveCheck() {
		if(emailReceiveCheck == null || emailReceiveCheck.equals("")){
			emailReceiveCheck = "f";
		}
		return emailReceiveCheck;
	}

	/**
	 * @param emailReceiveCheck the emailReceiveCheck to set
	 */
	public void setEmailReceiveCheck(String emailReceiveCheck) {
		this.emailReceiveCheck = emailReceiveCheck;
	}

    public String getDefaultPortalCodID() {
        return defaultPortalCodID;
    }

    public void setDefaultPortalCodID(String defaultPortalCodID) {
        this.defaultPortalCodID = defaultPortalCodID;
    }

    /**
     * Gets the default portal cod name.
     *
     * @return the default portal cod name
     */
    public String getDefaultPortalCodName() {
        return defaultPortalCodName;
    }

    /**
     * Sets the default portal cod name.
     *
     * @param defaultPortalCodName the new default portal cod name
     */
    public void setDefaultPortalCodName(String defaultPortalCodName) {
        this.defaultPortalCodName = defaultPortalCodName;
    }

    /**
     * @return the partnerTypeName
     */
    public String getPartnerTypeName() {
        return partnerTypeName;
    }

    /**
     * @param partnerTypeName the partnerTypeName to set
     */
    public void setPartnerTypeName(String partnerTypeName) {
        this.partnerTypeName = partnerTypeName;
    }

    /**
     * @return the operatorYN
     */
    public int getOperatorYN() {
        return operatorYN;
    }

    /**
     * @param operatorYN the operatorYN to set
     */
    public void setOperatorYN(int operatorYN) {
        this.operatorYN = operatorYN;
    }
    

	/**
	 * Gets the include secu groups.
	 *
	 * @return the include secu groups
	 */
	public String getIncludeSecuGroups() {
		return includeSecuGroups;
	}

	/**
	 * Sets the include secu groups.
	 *
	 * @param includeSecuGroups the new include secu groups
	 */
	public void setIncludeSecuGroups(String includeSecuGroups) {
		this.includeSecuGroups = includeSecuGroups;
	}

	/**
	 * Gets the exclude secu groups.
	 *
	 * @return the exclude secu groups
	 */
	public String getExcludeSecuGroups() {
		return excludeSecuGroups;
	}

	/**
	 * Sets the exclude secu groups.
	 *
	 * @param excludeSecuGroups the new exclude secu groups
	 */
	public void setExcludeSecuGroups(String excludeSecuGroups) {
		this.excludeSecuGroups = excludeSecuGroups;
	}     
	
    /**
     * Gets igm contactID
     * @return
     */
	public String getIgmContactID() {
		return igmContactID;
	}

	/**
	 * Sets igm contactID
	 * @param igmContactID
	 */
	public void setIgmContactID(String igmContactID) {
		this.igmContactID = igmContactID;
	}

	/**
	 * Gets igmIngOid
	 * @return
	 */
	public String getIgmIngOid() {
		return igmIngOid;
	}

	/**
	 * Sets igmIngOid
	 * @param igmIngOid
	 */
	public void setIgmIngOid(String igmIngOid) {
		this.igmIngOid = igmIngOid;
	}

	/**
	 * @return the etc
	 */
	public String getEtc() {
		return etc;
	}

	/**
	 * @param etc the etc to set
	 */
	public void setEtc(String etc) {
		this.etc = etc;
	}

	/**
	 * @return the password
	 */
	public String getPassword() {
		return password;
	}

	/**
	 * @param password the password to set
	 */
	public void setPassword(String password) {
		this.password = password;
	}

	/**
	 * @return the deptOid
	 */
	public String getDeptOid() {
		return deptOid;
	}

	/**
	 * @param deptOid the deptOid to set
	 */
	public void setDeptOid(String deptOid) {
		this.deptOid = deptOid;
	}

	/**
	 * @return the companyOid
	 */
	public String getCompanyOid() {
		return companyOid;
	}

	/**
	 * @param companyOid the companyOid to set
	 */
	public void setCompanyOid(String companyOid) {
		this.companyOid = companyOid;
	}

	public int getRnum() {
		return rnum;
	}

	public void setRnum(int rnum) {
		this.rnum = rnum;
	}
	
}
