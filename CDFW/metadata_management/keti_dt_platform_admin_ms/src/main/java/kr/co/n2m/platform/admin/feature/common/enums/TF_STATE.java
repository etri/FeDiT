/**
 * 
 */
package kr.co.n2m.platform.admin.feature.common.enums;

 /**
 * TRUE, FALSE 상태를 표현하는 ENUM
 * @author (주)엔투엠
 */
public enum TF_STATE {
	
	/** 활성 상태. */
	TRUE("1"),
	
	/** 비활성 상태. */
	FALSE("0"),
	
	/** 두 상태 모두. */
	ALL("-1");
	
	/** The value. */
    private String value;
	
    TF_STATE(String value) {
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
	 * 값에 맞는 TF_STATE를 찾는다.
	 *
	 * @param value TF_STATE 값
	 * @return 활성 상태
	 */
	public static TF_STATE findByValue(String value) {
	    TF_STATE[] tfStates = TF_STATE.values();
		
		for(TF_STATE tfState : tfStates) {
			if(tfState.toString().equals(value)) {
				return tfState;
			}
		}
		
		return null;
	}
}
