let ReactHookFormOptions: any = {};

ReactHookFormOptions.Required = (fieldName: string) => {
  return {
    required: {
      value: true,
      message: `* ${fieldName} : 필수 정보입니다.`,
    },
  };
};

ReactHookFormOptions.LoginId = (fieldName: string) => {
  return {
    required: {
      value: true,
      message: `* ${fieldName} : 필수 정보입니다.`,
    },
    pattern: {
      value: /^[a-z]+[a-z0-9]{3,19}$/,
      message: `* ${fieldName} : 영문자로 시작하는 영문자 또는 숫자 4~20자 로 입력해주세요.`
    }
  };
};

ReactHookFormOptions.Password = (fieldName: string) => {
  return {
    required: {
      value: true,
      message: `* ${fieldName} : 필수 정보입니다.`,
    },
    minLength: {
      value: 4,
      message: `* ${fieldName} : 최소 4자 이상으로 입력해주세요.`,
    },
    maxLength: {
      value: 20,
      message: `* ${fieldName} : 최대 20자 이하로 입력해주세요.`,
    },
  };
};

ReactHookFormOptions.UserName = {
  required: {
    value: true,
    message: "* 이름 : 필수 정보입니다.",
  },
  maxLength: {
    value: 20,
    message: "* 이름 : 최대 20자 이하로 입력해주세요.",
  },
};

ReactHookFormOptions.Email = {
  required: {
    value: true,
    message: "* 이메일 : 필수 정보입니다.",
  },
  pattern: {
    value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i,
    message: "* 이메일 : 이메일 형식이 아닙니다.",
  },
};

ReactHookFormOptions.PhoneNumber = {
  required: {
    value: true,
    message: "* 연락처 : 필수 정보입니다.",
  },
  pattern: {
    value: /^\d{2,3}-\d{3,4}-\d{4}$/,
    message: "* 연락처 : 연락처 형식이 아닙니다.",
  },
};

ReactHookFormOptions.AgreeCheckbox = {
  required: {
    value: true,
    message: "이용약관에 동의해주세요.",
  },
};

ReactHookFormOptions.ExternalUrl = {
  required: {
    value: true,
    message: "* 외부Url : 필수 정보입니다.",
  },
  maxLength: {
    value: 200,
    message: "* 외부Url : 최대 200자 이하로 입력해주세요.",
  },
  validate: {
    protocol: (fieldValue: any) => {
      return (
        /https?:\/\//.test(fieldValue) ||
        "* 외부Url : http:// 혹은 https:// 형식으로 입력해 주세요."
      );
    },
  },
};

ReactHookFormOptions.RestIp = {
  required: {
    value: true,
    message: "* RestIP : 필수 정보입니다.",
  },
  maxLength: {
    value: 200,
    message: "* RestIP : 최대 200자 이하로 입력해주세요.",
  },
  // pattern: {
  //   value:
  //     /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/,
  //   message: "* RestIP : IP 형식을 확인해주세요.",
  // },
};

ReactHookFormOptions.RestPort = {
  required: {
    value: true,
    message: "* RestPort : 필수 정보입니다.",
  },
  min: {
    value: 0,
    message: "* RestPort : port 번호를 0 이상으로 입력해주세요.",
  },
  max: {
    value: 65535,
    message: "* RestPort : port 번호를 65535 이하로 입력해주세요.",
  },
  setValueAs: (v: string) => (v === "" ? null : parseInt(v)),
};

ReactHookFormOptions.SwaggerUrl = {
  required: {
    value: true,
    message: "* API 문서 Url : 필수 정보입니다.",
  },
  maxLength: {
    value: 200,
    message: "* API 문서 Url : 최대 200자 이하로 입력해주세요.",
  },
  pattern: {
    value: /https?:\/\//,
    message: "* API 문서 Url : http:// 혹은 https:// 형식으로 입력해 주세요.",
  },
};

ReactHookFormOptions.DataName = {
  required: {
    value: true,
    message: "* 데이터이름 : 필수 정보입니다.",
  },
  maxLength: {
    value: 50,
    message: "* 데이터이름 : 최대 50자 이하로 입력해주세요.",
  },
};

ReactHookFormOptions.ServiceId = {
  required : {
      value: true,
      message: "* 서비스아이디 : 필수 정보입니다.",
  },
  maxLength: {
    value: 50,
    message: "* 서비스아이디 : 최대 50자 이하로 입력해주세요.",
  },
};

ReactHookFormOptions.SwaggerHomepath = {
  // required: {
  //   value: true,
  //   message: "* API 문서 HomePath : 필수 정보입니다.",
  // },
  maxLength: {
    value: 50,
    message: "* API 문서 HomePath : 최대 50자 이하로 입력해주세요.",
  },
};

ReactHookFormOptions.SwaggerTagList = {
  maxLength: {
    value: 2000,
    message: "* API 문서 Tag List : 최대 2000자 이하로 입력해주세요.",
  },
};

ReactHookFormOptions.DataDesc = {};

ReactHookFormOptions.DataUsePurpose = (fieldName: string) => {
  return {
    required: {
      value: true,
      message: `* ${fieldName} : 필수 정보입니다.`,
    },
    maxLength: {
      value: 2000,
      message: `* ${fieldName} : 최대 2000자 이하로 입력해주세요.`,
    },
  };
};

export default ReactHookFormOptions;
