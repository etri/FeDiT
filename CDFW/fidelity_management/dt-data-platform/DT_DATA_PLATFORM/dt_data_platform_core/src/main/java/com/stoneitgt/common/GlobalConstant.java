package com.stoneitgt.common;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

import com.stoneitgt.common.GlobalConstant.FILE_REF_TYPE;
import com.stoneitgt.dt.data.platform.properties.BaseSystemProperties;




public class GlobalConstant {
	
	@Autowired
	public BaseSystemProperties systemProperties;
	
	public static final String SESSION_ADMIN_KEY = "ss_admin";
	public static final String SESSION_USER_KEY = "ss_user";

	public static List<Map<String, Object>> ALLOWED_IP_ADDRESS = new ArrayList<>();

	public static final String[] BLACK_ID_LIST = { "admin", "super", "root" };

	public static final class PAGE_SIZE {
		public static final int DEFAULT_SIZE = 10;
		public static final int MYPAGE_HISTORY = 5;
	}

	public static final class API_STATUS {
		public static final int SUCCESS = 200;
		public static final int FAIL = -100;
		public static final int FAIL_MAPPING = -111;
		public static final int AUTH_DENY = -999;
		public static final int NO_AUTH = -900;
		public static final int INTERNAL_SERVER_ERROR = 500;
	}

	public static final class CRUD_TYPE {
		public static final String INSERT = "1";
		public static final String UPDATE = "2";
		public static final String DELETE = "3";
		public static final String SAVE = "4";
	}

	public static final class FILE_REF_TYPE {
		public static final String DATA = "data";
		public static final String ORIGIN = "origin";
		public static final String INTERPOLATE = "interpolate";
		public static final String OUTLIER = "outlier";
		public static final String VALIDATE = "validate";
		public static final String RESAMPLE = "resample";
		public static final String MODEL = "model";
		public static final String HISTORY = "history";
		public static final String RESOURCE = "resource";
		public static final String PREDICTION = "prediction";
		public static final String TEST = "test";
		public static final String CORRELATION = "correlation";
		public static final String UNIT = "unit";
		public static final String AUGMENT = "augment";
		public static final String ONETIME = "onetime";
		public static final String CYCLE = "cycle";
	}


	public static final class PLAN_USER_STATUS {
		public static final String REGISTER = "A";
		public static final String APPROVE = "B";
		public static final String CERTIFICATE = "C";
		public static final String CANCEL = "F";
		public static final String ATTEND = "G";
	}

}
