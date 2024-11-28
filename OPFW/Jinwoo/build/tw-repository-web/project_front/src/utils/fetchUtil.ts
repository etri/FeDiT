import { customAlert } from "@/utils/dialogUtil";

const errorHandler = async(response: Response, failCallback?:((message:string)=>void)) => {
  let servletPath = document.URL;
  servletPath = servletPath.substring(servletPath.indexOf("/", servletPath.indexOf("//")+2));
  if(servletPath.indexOf("?") != -1) {
    servletPath = servletPath.substring(0, servletPath.indexOf("?"));
  }
  servletPath = servletPath.substring(0,7);

  if(response.status === 401) {
    if("/system/" == servletPath) {
      customAlert("인증에 실패 했습니다. 로그인 페이지로 이동합니다.");
      location.href = "<c:url value='/login/loginForm.mng'>";
    } else {
      customAlert("인증에 실패 했습니다. 로그인 페이지로 이동합니다.");
      location.href = "<c:url value='/loginForm.mng'>";
    }
  }else if(response.status === 403) {
    if("/system/" == servletPath){
      customAlert("세션이 만료가 되었습니다. 로그인 페이지로 이동합니다.");
      location.href = "/login/loginForm.mng";
    } else {
      customAlert("세션이 만료가 되었습니다. 로그인 페이지로 이동합니다.");
      location.href = "/loginForm.mng";
    }
  }else if(response.status === 404) {
      location.href = "/error/error.mng?errorCode=404";
  }else{
    let json = await response.json();
    if (failCallback) {
      failCallback(json.message);
    } else {
      customAlert(json.message);
    }
    console.log(JSON.stringify(json));
  }
};

const thenResponse = async(response: Response, param: any) => {
  if (!response.ok) {
    await errorHandler(response, param.failCallback);
    return;
  }

  const contentType = response.headers.get('Content-Type');
  if (!contentType || !contentType.includes('application/json')) {
    if (param.successCallback) {
      param.successCallback(null);
    } else {
      customAlert("성공하였습니다.");
    }
    return;
  }
  return response.json();
}

const catchError = (error: Error, param:any) => {
  if (param.failCallback) {
    param.failCallback(error.message);
  } else {
    customAlert(error.message);
  }
}

const thenResponseJson = async(responseJson:any, param:any)=> {
  if (!responseJson) {
    return;
  }

  if (param.successCallback) {
    param.successCallback(responseJson);
  } else {
    customAlert("성공하였습니다.");
  }
}

const fetchGet = async (url: string, param: any) => {
  let option: any = {
    method: "GET",
    headers: {
      Accept: "application/json",
    }
  };

  if (param && param.param !== null) {
    option.body = param.param;
  }

  return fetch(url, option)
    .then(async (response : Response) => thenResponse(response, param) )
    .then((responseJson) => thenResponseJson(responseJson, param))
    .catch((error) => catchError(error, param));
};

const fetchJson = async (method: string, url: string, param: any) => {
  let option: any = {
    method: method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json;charset=UTF-8",
    },
  };

  if (param && param.data !== null) {
    option.body = JSON.stringify(param.data);
  }

  return fetch(url, option)
    .then(async (response : Response) => thenResponse(response, param) )
    .then((responseJson) => thenResponseJson(responseJson, param))
    .catch((error) => catchError(error, param));
};

const fetchForm = async (method: string, url: string, data: any) => {
  let keys = Object.keys(data);
  let param = keys.reduce((accumulator, currentKey) => {
    accumulator.append(currentKey, data[currentKey]);
    return accumulator;
  }, new URLSearchParams());

  return fetch(url, {
    method: method,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: param,
  });
};

const isResponseSuccess = (response: any) => {
  return response.status >= 200 && response.status < 300;
};

export { errorHandler, fetchGet, fetchJson, fetchForm, isResponseSuccess };
