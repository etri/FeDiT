import dayjs from 'dayjs';
import cookie from 'js-cookie'

import { getCurrentInstance } from "vue";
import router from '@/router'

// string Empty 체크
const isEmpty = (value) => {
  // console.log(value + " - " + typeof value);

  const obj = String(value);

  if (obj == null || obj == undefined || obj == 'null' || obj == 'undefined' || obj == '' || obj == 'NaN') {
    return true;
  } else {
    return false;
  }
}

//객체 복사
const copyObject = (obj) => {
  let result = '';
  if (Array.isArray(obj)) {
    result = [];
    for (let idx in obj) {
      if (typeof (obj[idx]) == 'object') {
        result.push(copyObject(obj[idx]));
      } else {
        result.push(obj[idx]);
      }
    }
  } else {
    result = {};
    for (let key in obj) {
      if (typeof (obj[key]) == 'object' && obj[key]) {
        result[key] = copyObject(obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }
  return result;
}

const now = (format) => {
  if (format == null || format == '') {
    return dayjs().format("YYYY-MM-DD HH:mm:ss");
  }
  else {
    return dayjs().format(format);
  }
}

const nowTimestamp = () => {
  return dayjs().valueOf();
}

const getNow = () => {
  return dayjs().format("YYYY-MM-DD");
};

const getTime = () => {
  return dayjs().format("HH:mm:ss");
};

const getNowDateTime = () => {
  return dayjs().format("YYYY-MM-DD HH:mm:ss");
};

const getNowDateTime2 = () => {
  return dayjs().format("MM/DD HH:mm");
};

const getMonth = () => {
  return dayjs().format('MM')
}

const getDay = () => {
  return dayjs().format('DD')
}

const getLastDayOfMonth = () => {
  return dayjs().daysInMonth();
}

const getDateFormatter = (dt, formatter) => {
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
const getDateTime = (dt) => {
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

const getYm = (dt) => {
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

const getYMD = (strDate, delimiter) => {
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
const setNumPad = (num, len) => {
  let str = "";
  str = "" + num;
  while (str.length < len) {
    str = "0" + str;
  }

  return str;
}

const emailCheck = (email) => {
  // 정규표현식을 정의합니다.
  let regex = /([\w-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/;
  return (email != '' && email != 'undefined' && regex.test(email));
}

const fileSizeCheck = (file, size) => {
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

const fileExtCheck = (file) => {
  let rst = false;
  let fileNm = "";
  let lastDot = 0;
  let fileExt = "";

  fileNm = file.name;
  lastDot = fileNm.lastIndexOf(".");

  fileExt = fileNm.substring(lastDot + 1, fileNm.length).toLowerCase();

  if (fileExt == "hwp" || fileExt == "doc" || fileExt == "docx" || fileExt == "ppt" || fileExt == "pptx" || fileExt == "xls" || fileExt == "xlsx" || fileExt == "mp4" ||
    fileExt == "jpg" || fileExt == "jpeg" || fileExt == "png" || fileExt == "psd" || fileExt == "zip" || fileExt == "alz" || fileExt == "7z" || fileExt == "pdf" || fileExt == "apk" ||
    fileExt == "mht" || fileExt == "eml" || fileExt == "txt" || fileExt == "msg") {
    rst = true;
  } else {
    rst = false;
  }

  return rst;
}

// 천단위 콤마
const commaFormat = (val) => {
  if (!val) {
    return 0;
  }
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const getAddDate = (format, periodUnit, num) => {
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

const getDate = (fm) => {
  return dayjs().format(fm);
}

const setCookie = (name, value, params) => {
  var paramsObj = params || {};
  if (!paramsObj.hasOwnProperty('expires')) {
    // default 180 min
    paramsObj.expires = new Date(new Date().getTime() + (1 * 180) * 60 * 1000);
  }
  cookie.set(name, value, paramsObj)
}


const getCookie = (name) => {
  return cookie.get(name);
}

const deleteCookie = (name) => {
  cookie.remove(name);
}

const generateId = (prefixVal) => {
  const id = Date.now().toString().substring(4) + Math.floor(Math.random() * 100);
  if (prefixVal) {
    return prefixVal + id;
  }
  return id;
}

const getGlobalProperties = () => {
  return getCurrentInstance().appContext.config.globalProperties;
}

const commonFileDownload = (axios, downloadUrl, fileLogicalNm, filePhysicalNm) => {
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


const previewFile = async (axios, downloadUrl, fileRestoNm, fileOriginNm) => {
  let { data } = await axios
    .get(downloadUrl, {
      params: {
        fileRestoNm: fileRestoNm,
        fileOriginNm: fileOriginNm,
      },
      responseType: "blob",
    })
  return window.URL.createObjectURL(new Blob([data]));
};

const isReadYn = (data) => {
  if (data.readYn == 'Y') return true;
  else return false;
}

const isWriteYn = (data) => {
  if (data.writeYn == 'Y') return true;
  else return false;
}

const isAmdYn = (data) => {
  if (data.amdYn == 'Y') return true;
  else return false;
}

const isDelYn = (data) => {
  if (data.delYn == 'Y') return true;
  else return false;
}

const routerPush = (platform, name, query) => {
  router.push({
    name: platform + "_" + name,
    query: query
  });
}

export default {
  isEmpty,
  copyObject,
  now,
  nowTimestamp,
  getNow,
  getTime,
  getNowDateTime,
  getNowDateTime2,
  getMonth,
  getDay,
  getLastDayOfMonth,
  getDateFormatter,
  getDateTime,
  getYm,
  getYMD,
  setNumPad,
  emailCheck,
  fileSizeCheck,
  fileExtCheck,
  commaFormat,
  getAddDate,
  getDate,
  setCookie,
  getCookie,
  deleteCookie,
  generateId,
  commonFileDownload,
  isReadYn,
  isWriteYn,
  isAmdYn,
  isDelYn,
  routerPush
}