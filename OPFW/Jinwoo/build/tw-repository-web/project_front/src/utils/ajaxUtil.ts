function errorHandlerAjaxJson(xhr:XMLHttpRequest & {responseJSON?: any}) {
  let responseJSON = xhr.responseJSON;

  if (responseJSON.message == null || responseJSON.message == undefined) {
    alert('서버와 통신 중 문제가 발생했습니다');
  } else {
    alert(responseJSON.message);
  }

  let errorLog = responseJSON.errorLog;
  if(errorLog != null && errorLog != undefined) {
    console.log(errorLog);
  }else{
    console.log(JSON.stringify(responseJSON));
  }
}

function errorHandlerAjax(xhr:XMLHttpRequest & {responseJSON?: any}) {
  let responseJSON = xhr.responseJSON;
  if( responseJSON != null && responseJSON != undefined ) {
    errorHandlerAjaxJson(xhr);
    return;
  }

  let servletPath = document.URL;
  servletPath = servletPath.substring(servletPath.indexOf("/", servletPath.indexOf("//")+2));
  if(servletPath.indexOf("?") != -1) {
    servletPath = servletPath.substring(0, servletPath.indexOf("?"));
  }
  servletPath = servletPath.substring(0,7);

  if(xhr.status == 401) {
    if("/system/" == servletPath) {
      alert("인증에 실패 했습니다. 로그인 페이지로 이동합니다.");
      location.href = "<c:url value='/login/loginForm.mng'>";
    } else {
      alert("인증에 실패 했습니다. 로그인 페이지로 이동합니다.");
      location.href = "<c:url value='/login.do'>";
    }
  } else if(xhr.status == 403 || xhr.status == 500) {
    if("/system/" == servletPath){
      alert("세션이 만료가 되었습니다. 로그인 페이지로 이동합니다.");
      location.href = "/login/loginForm.mng";
    } else {
      alert("세션이 만료가 되었습니다. 로그인 페이지로 이동합니다.");
      location.href = "/login/loginForm.mng";
    }
  }
}

export { errorHandlerAjax };