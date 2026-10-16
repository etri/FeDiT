/**
 * 
 */
package kr.co.n2m.platform.admin.feature.common.enums;

/**
 * 활성 상태를 표현하는 ENUM
 * @author (주)엔투엠
 */
public enum ACTIVE_STATE {
	
	/** 활성 상태. */
	YES("1"),
	
	/** 비활성 상태. */
	NO("0"),
	
	/** 두 상태 모두. */
	ALL("-1");
	
	/** The value. */
    private String value;
	
	ACTIVE_STATE(String value) {
		this.value = value;
	}
	
	/* (non-Javadoc)
	 * @see java.lang.Enum#toString()
	 */
	@Override
    public String toString() {
        return value;
    }
	
	/**
	 * 값에 맞는 ACTIVE_STATE_ENUM을 찾는다.
	 *
	 * @param value ACTIVE_STATE_ENUM 값
	 * @return 활성 상태
	 */
	public static ACTIVE_STATE findByValue(String value) {
		ACTIVE_STATE[] activeStates = ACTIVE_STATE.values();
		
		for(ACTIVE_STATE activeState : activeStates) {
			if(activeState.toString().equals(value)) {
				return activeState;
			}
		}
		
		return null;
	}
}
