import dayjs from 'dayjs';

var customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);

import cookie from 'js-cookie'

import { getCurrentInstance } from "vue";
import router from '@/router'

import {
  redirectLoginView,
} from "@/assets/js/auth.js";

// string Empty 체크
export const isEmpty = (value) => {
  // console.log(value + " - " + typeof value);

  const obj = String(value);

  if (obj == null || obj == undefined || obj == 'null' || obj == 'undefined' || obj == '' || obj == 'NaN') {
    return true;
  } else {
    return false;
  }
}

//객체 복사
export const copyObject = (obj) => {
  let result = '';
  if (Array.isArray(obj)) {
      result = [];
      for (let idx in obj) {
          if (typeof(obj[idx]) == 'object') {
              result.push(copyObject(obj[idx]));
          } else {
              result.push(obj[idx]);
          }
      }
  } else {
      result = {};
      for (let key in obj) {
          if (typeof(obj[key]) == 'object' && obj[key]) {
              result[key] = copyObject(obj[key]);
          } else {
              result[key] = obj[key];
          }
      }
  }
  return result;
}

export const now = (format) => {
  if (format == null || format == '') {
      return dayjs().format("YYYY-MM-DD HH:mm:ss");
  }
  else {
      return dayjs().format(format);
  }
}

export const getCalcDate = (days) => {
  return dayjs().add(days, 'day').format("YYYY-MM-DD");
}

export const getCalcDateTime = (minutes) => {
  return dayjs().add(minutes, 'minute').format("YYYY-MM-DD HH:mm:ss");
}

export const getDateByString = (dateString, format) => {
  return dayjs(dateString, format).toDate();
}

export const nowTimestamp = () => {
  return dayjs().valueOf();
}

export const getNow = () => {
  return dayjs().format("YYYY-MM-DD");
};

export const getTime = () => {
  return dayjs().format("HH:mm:ss");
};

export const getNowDateTime = () => {
  return dayjs().format("YYYY-MM-DD HH:mm:ss");
};

export const getNowDateTime2 = () => {
  return dayjs().format("MM/DD HH:mm");
};

export const getMonth = () => {
  return dayjs().format('MM')
}

export const getDay = () => {
  return dayjs().format('DD')
}

export const getLastDayOfMonth = () => {
  return dayjs().daysInMonth();
}

export const getDateFormatter = (dt, formatter) => {
  let date = null;

  if (typeof dt == "undefined" || dt == null || dt == "null" || dt == "") {
    date = new Date();
  } else {
    date = new Date(dt);
  }
  
  let yyyy = date.getFullYear();
  let MM = setNumPad(date.getMonth() + 1, 2);
  let dd = setNumPad(date.getDate(), 2);

  let rstDate = "";
  rstDate = yyyy + MM + dd;
  if (formatter != null && formatter != '') {
    rstDate = dayjs(rstDate).format(formatter);
  }
  
  return rstDate;
}

// DateTime 가져오기 
export const getDateTime = (dt) => {
    let date = null;
  
    if (typeof dt == "undefined" || dt == null || dt == "null" || dt == "") {
      date = new Date();
    } else {
      date = new Date(dt);
    }

    let yyyy = date.getFullYear();
    let MM = setNumPad(date.getMonth() + 1, 2);
    let dd = setNumPad(date.getDate(), 2);
    let hh = setNumPad(date.getHours(), 2);
    let mm = setNumPad(date.getMinutes(), 2);
    let ss = setNumPad(date.getSeconds(), 2);

    let rstDate = "";
    rstDate = yyyy + MM + dd + hh + mm + ss;

    return rstDate;
  }

export const getYm = (dt) => {
    let date = null;
  
    if (typeof dt == "undefined" || dt == null || dt == "null" || dt == "") {
      date = new Date();
    } else {
      date = new Date(dt);
    }
    
    let yyyy = date.getFullYear();
    let MM = setNumPad(date.getMonth() + 1, 2);
    let rstDate = "";
    rstDate = yyyy + MM
    return rstDate;
  }
  
  export const getYMD = (strDate, delimiter) => {
    let y = "";
    let m = "";
    let d = "";
  
    y = strDate.substring(0, 4);
    m = strDate.substring(4, 6);
    d = strDate.substring(6, 8);
  
    if (delimiter == null || typeof delimiter == "undefined") {
      delimiter = "";
    }
  
    return y + delimiter + m + delimiter + d
  }
  
  // 숫자 자리 맞추기
  export const setNumPad = (num, len) => {
    let str = "";
    str = "" + num;
    while (str.length < len) {
      str = "0" + str;
    }
  
    return str;
  }

  export const emailCheck = (email) => {
    // 정규표현식을 정의합니다.
    let regex=/([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
    return (email != '' && email != 'undefined' && regex.test(email));
  }

  export const fileSizeCheck = (file, size) => {
    let rst = false;
    const maxSize = size * 1024 * 1024;
    let fileSize = 0;
  
    fileSize = file.size;
  
    if (fileSize > maxSize) {
      rst = false;
    } else {
      rst = true;
    }
  
    return rst;
  }
  
  export const fileExtCheck = (file) => {
    let rst = false;
    let fileNm = "";
    let lastDot = 0;
    let fileExt = "";
  
    fileNm = file.name;
    lastDot = fileNm.lastIndexOf(".");
  
    fileExt = fileNm.substring(lastDot + 1, fileNm.length).toLowerCase();
  
    if (fileExt == "hwp" || fileExt == "doc" || fileExt == "docx" || fileExt == "ppt" || fileExt == "pptx" || fileExt == "xls" || fileExt == "xlsx" || fileExt == "mp4" ||
      fileExt == "jpg" || fileExt == "jpeg" || fileExt == "png" || fileExt == "psd" || fileExt == "zip" || fileExt == "alz" || fileExt == "7z" || fileExt == "pdf" || fileExt == "apk" ||
      fileExt == "mht" || fileExt == "eml" || fileExt == "txt" || fileExt == "msg")
    {
      rst = true;
    } else {
      rst = false;
    }
  
    return rst;
  }

  // 천단위 콤마
  export const commaFormat = (val) => {
    if (!val) {
      return 0;
    }
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  export const getAddDate = (format, periodUnit, num) => {
    // periodUnit
    // 일 : d
    // 달 : M
    // 년 : y
    // 주 : w
    // 시 : h
    // 분 : m
    // 초 : s
    // 밀리초 : ms
    return dayjs().add(num, periodUnit).format(format);
  }
  
  export const getDate = (fm) => {
    return dayjs().format(fm);
  }

  export const setCookie = (name, value, params) => {
    var paramsObj = params || {};
    if ( !Object.prototype.hasOwnProperty.call(paramsObj, 'expires') ) {
    // if (!paramsObj.hasOwnProperty('expires')) {
      // default 180 min
      paramsObj.expires = new Date(new Date().getTime() + ( 1 * 180 ) * 60 * 1000);
    }
    cookie.set(name, value, paramsObj)
  }
  
  
  export const getCookie = (name) => {
    return cookie.get(name);
  }
  
  export const deleteCookie = (name) => {
    cookie.remove(name);
  }

  export const generateId = (prefixVal) => {
    const id = Date.now().toString().substring(4) + Math.floor(Math.random() * 100);
    if (prefixVal) {
      return prefixVal + id;
    }
    return id;
  }

  export const getGlobalProperties = () => {
    return getCurrentInstance().appContext.config.globalProperties;
  }

  export const commonFileDownload = (axios, downloadUrl, fileLogicalNm, filePhysicalNm) => {
    const getFilename = (contentDisposition) => {
      let fileName = contentDisposition.split(';').filter((ele) => {
        return ele.indexOf('filename') > -1
      }).map((ele) => {
        return ele.replace(/"/g, '').split('=')[1]
      })
      return fileName[0] ? decodeURIComponent(fileName[0]) : null
    };

    axios.get(downloadUrl, {
      params: {
        fileRestoNm: fileLogicalNm,
        fileOriginNm: filePhysicalNm,
      },
      responseType: 'blob'
    })
    .then(function (response) {
      const content = response;
      const blob = new Blob([content.data], { type: content.headers["content-type"] });
      const elink = document.createElement("a");
      elink.style.display = "none";
      elink.href = window.URL.createObjectURL(blob);
      elink.setAttribute('download', getFilename(content.headers["content-disposition"]));
      document.body.appendChild(elink);
      elink.click();
      URL.revokeObjectURL(elink.href);
      document.body.removeChild(elink);
    });
  }
  

  export const previewFile = async (axios, downloadUrl, fileRestoNm, fileOriginNm) => {
    let {data} = await  axios
    .get(downloadUrl, {
      params: {
        fileRestoNm : fileRestoNm,
        fileOriginNm : fileOriginNm,
      },
      responseType: "blob",
    })
    return window.URL.createObjectURL(new Blob([data]));
  };

  export const isReadYn =(data) => {
    if(data.readYn == 'Y') return true;
    else return false;
  }
  
  export const isWriteYn = (data) => {
    if(data.writeYn == 'Y') return true;
    else return false;
  }
  
  export const isAmdYn = (data) => {
    if(data.amdYn == 'Y') return true;
    else return false;
  }
  
  export const isDelYn = (data) => {
    if(data.delYn == 'Y') return true;
    else return false;
  }

  export const routerPush = (platform, name, query) => {
    if(platform == null) return redirectLoginView();
    router.push({
      name: platform + "_" + name,
      query: query
    });
  }

  export const getSuperAdmin = async (axios, url) => {
    let result = await axios.get(url);
      return result.data;
  };

  export const consoleTimeLog = (log) => {
    if (typeof log === 'object') {
      console.log(nowTimestamp() + ' =>\n' + JSON.stringify(log, null, 2));
    }
    else {
      console.log(nowTimestamp() + ' => ' + log);
    }
}


export const hasValidateNullPoint = (data) => {
  if (!data) return true;

  if(typeof data.toString() === "undefined" || data.toString() === null) {
    return true;
  }

  if(data.toString().replace(/\s*/g, "") === ""){
    return true;
  }

  return false;
}

export const hasValidateKoreanPiont = (data) => {
  const koreanCheck = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/;
    if(koreanCheck.test(data.toString().replace(/\s*/g, ""))){
      return true;
    }
    return false;
}

export const hasValidateSpcecialChar = (data) => {
  const spcChar = /[^0-9a-z-_]/gi;

  if(spcChar.test(data.toString().replace(/\s*/g, ""))){
    return true;
  }
  return false;
}

export const hasValidateNumber = (data) => {
  const numberCheck = /^\d+$/;

  if (typeof data !== 'string') {
    data = data.toString(); // Convert to string if it's a number
  }

  if(numberCheck.test(data.replace(/\s*/g, ""))){
    return true;
  }
  return false;
}

export const hasValidateUrls = (data) => {
  const urlPattern = /^http:\/\/.*$/;
  const boolResult = false;

  if(typeof data !== "undefined" && typeof data !== "null" && data !== null){
    if(data.replace(/\s*/g, "") !== ""){
      //http가 잘 되어있으면 false, 잘안되어있음 true
      let urls = data.replace(/\s*/g, "").split(",");
      for(let url of urls){
        if(! urlPattern.test(url)){
          boolResult = true; 
          break;
        }
      }
    }
  }
  return boolResult;
}

export const hasValidateEssenceOrRealNumCheck = (data) => {
  const essenceOrRealNumChk = /^(?:[1-9]\d*|0)(?:\.\d+)?$/;

  if(essenceOrRealNumChk.test(data)){
    return true;
  }
  return false;
}

export const hasValidateNegetiveNumCheck = (data) => {
  const negetiveNumCheck = /^(?:-?(?:[1-9]\d*|0)(?:\.\d+)?)$/;

  if(negetiveNumCheck.test(data)){
    return true;
  }
  return false;
}
