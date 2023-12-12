// --------------------------------------------------
// meta 플랫폼 공통 js
// --------------------------------------------------

/**
 * 공개 리소스 페이지 새 창에서 보여주기
 * @param {*} medataSetId 
 */
const showMetadataResourcePage = (medataSetId) => {
  if (medataSetId) {
    const url = window.location.origin + "/meta/resource/page/" + medataSetId;
    window.open(url, "winMetadataResourcePage");
  }
}

/**
 * 공개 ketidt turtle info 페이지 새 창에서 보여주기
 */
const showKetidtInfoPage = () => {
  const url = window.location.origin + "/meta/ns/digitaltwin#";
  window.open(url, "winKetidtInfoPage");
}

/**
 * 공개 ketidtskos turtle info 페이지 새 창에서 보여주기
 */
const showKetidtskosInfoPage = () => {
  const url = window.location.origin + "/meta/skos/digitaltwin#";
  window.open(url, "winKetidtskosInfoPage");
}

/**
 * 메타데이터 정보 JSON 파일 다운로드
 * @param {*} publicMedataSetInfo, medataSetNm
 */
const downloadMetadataFile = (publicMedataSetInfo, medataSetNm) => {
  const text = JSON.stringify(publicMedataSetInfo, null, 2);
  const filename = medataSetNm;
  const element = document.createElement("a");
  const extension = ".json";
  const mediaType = "application/json";

  element.setAttribute("href", "data:" + mediaType + ";charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", filename + extension);
  document.body.appendChild(element);
  element.click();
}

/**
 * RDF 정보 파일 다운로드
 * @param {*} rdfStr, mtcd, fileName
 */
const downloadRdfFile = (rdfStr, mtcd, fileName) => {
  const text = rdfStr;
  const writeType = mtcd;
  const element = document.createElement("a");

  let extension = ".txt";
  let mediaType = "text/plain";

  if (writeType == "xml" || writeType == "xml_abbrev") {
    extension = ".rdf";
    mediaType = "application/rdf+xml";
  }
  if (writeType == "turtle" || writeType == "turtle_flat") {
    extension = ".ttl";
    mediaType = "text/turtle";
  }
  if (writeType == "n_triple") {
    extension = ".nt";
    mediaType = "application/n-triples";
  }
  if (writeType == "n3") {
    extension = ".n3";
    mediaType = "text/n3";
  }
  if (writeType == "json_ld") {
    extension = ".jsonld";
    mediaType = "application/ld+json";
  }
  if (writeType == "json") {
    extension = ".json";
    mediaType = "application/json";
  }

  element.setAttribute("href", "data:" + mediaType + ";charset=utf-8," + encodeURIComponent(text));
  element.setAttribute("download", fileName + extension);
  document.body.appendChild(element);
  element.click();
}


const Buttons = {
  metadataResourcePage : {
    label: "메타데이터 한번에 보기",
    click: showMetadataResourcePage
  },
  ketidtInfoPage : {
    label: "디지털트윈 네임스페이스 정의 보기",
    click: showKetidtInfoPage
  },
  ketidtskosInfoPage : {
    label: "디지털트윈 카테고리 개념 정의 보기",
    click: showKetidtskosInfoPage
  },
  metadataFileDownload : {
    label: "다운로드", // 메타데이터 파일 다운로드
    click: downloadMetadataFile
  }
}

export default {
  Buttons, downloadRdfFile
}




