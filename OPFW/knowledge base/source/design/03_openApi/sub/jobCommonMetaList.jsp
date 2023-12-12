<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>


<form action="/udt/schedule/insertNewRdfMetaCommon.do">
<div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">소속부서명 <br/>
       <small class="text-navy"><i class="fa fa-tag" style="margin-right: 5px;"></i>vcard:fn</small></label>
        <div class="col-sm-9"><input type="text" name="vcardFn" id="vcardFn" disabled class="form-control" value="<c:out value="${resultMap.vcardFn}"/>"></div>
   </div>
   
   <div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">소속부서 대표 메일 <br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>vcard:hasEmail</small></label>
       <div class="col-sm-9">
           <div class="input-group m-b">
           	<input type="text" placeholder="" id="vcardHasemail1" name="vcardHasemail1" value="<c:out value="${resultMap.vcardHasemail1}"/>" disabled class="form-control">
               <div class="input-group-prepend">
                   <span class="input-group-addon">@</span>
               </div>
               <input type="text" placeholder="" id="vcardHasemail2" name="vcardHasemail2" value="<c:out value="${resultMap.vcardHasemail2}"/>" disabled class="form-control">
           </div>
       </div>
   </div>
   
   <div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">소속부서 대표 전화번호 <br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>vcard:hasTelephone</small></label>
        <div class="col-sm-9"><input type="text" name="vcardHastelephone" id="vcardHastelephone" disabled class="form-control" value="<c:out value="${resultMap.vcardHastelephone}"/>"></div>
   </div>
   
   <div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">소속기관명 <br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>foaf:name</small></label>
        <div class="col-sm-9"><input type="text" name="foafName" id="foafName" disabled class="form-control" value="<c:out value="${resultMap.foafName}"/>"></div>
   </div>
   
   <div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">소속기관 대표 홈페이지 <br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>foaf:homepage</small></label>
        <div class="col-sm-9"><input type="text" name="foafHomepage" id="foafHomepage" disabled class="form-control" value="<c:out value="${resultMap.foafHomepage}"/>"></div>
   </div>
   
   <div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">소속기관 대표 메일 <br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>foaf:mbox</small></label>
       <div class="col-sm-9">
           <div class="input-group m-b"> 
           	<input type="text" placeholder="" id="foafMbox1" name="foafMbox1" disabled class="form-control" value="<c:out value="${resultMap.foafMbox1}"/>">
               <div class="input-group-prepend">
                   <span class="input-group-addon">@</span>
               </div>
               <input type="text" placeholder="" id="foafMbox2" name="foafMbox2" disabled class="form-control" value="<c:out value="${resultMap.foafMbox2}"/>">
           </div>
       </div>
   </div>
   
   <div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">소속기관 대표 전화번호 <br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>foaf:phone</small></label>
        <div class="col-sm-9"><input type="text" name="foafPhone" id="foafPhone" disabled class="form-control" value="<c:out value="${resultMap.foafPhone}"/>"></div>
   </div>
   
   <div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">데이터셋 라이센스<br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>dct:license</small></label>
        <div class="col-sm-9">
        	<textarea style="height: 138px;" name="dctLicense" id="dctLicense" disabled class="form-control"><c:out value="${resultMap.dctLicense}"/></textarea>
        	</div>
   </div>
   
   <div class="hr-line-dashed"></div>
<div class="form-group row">
	<label class="col-sm-2 col-form-label">데이터셋 권리문구 <br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>dct:rights</small></label>
        <div class="col-sm-9"><input type="text" name="dctRights" id="dctRights" disabled class="form-control" value="<c:out value="${resultMap.dctRights}"/>"></div>
   </div>
   
  <!--  <div class="hr-line-dashed"></div>
   <div class="form-group row"><label class="col-sm-2 col-form-label">Help text</label>
       <div class="col-sm-9"><input type="text" class="form-control"> <span class="form-text m-b-none">A block of help text that breaks onto a new line and may extend beyond one line.</span>
       </div>
   </div> -->
   
   <div class="hr-line-dashed"></div>
</form>