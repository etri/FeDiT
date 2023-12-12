<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c"      uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form"   uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="ui"     uri="http://egovframework.gov/ctl/ui"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<form action="/udt/schedule/insertNewRdfMetaDataset.do" style="margin-top:20px;">
	<div class="form-group row">
	<label class="col-sm-2 col-form-label">상품코드 <br/>
       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>dct:identifier</small></label>
        <div class="col-sm-9">
        	<input type="text" name="dctIdentifier" id="dctIdentifier" disabled class="form-control never-show" value="<c:out value="${resultMap.dctIdentifier}"/>">
        	<span class="form-text m-b-none frm-add-span">
        		<small><i class="fa fa-exclamation-circle"></i>상품코드는 변경하실 수 없습니다.</small>
        	</span>
        </div>
   </div>
   <div class="hr-line-dashed"></div>
	<div class="form-group row">
	<label class="col-sm-2 col-form-label">데이터셋 제목 <br/>
       <small class="text-navy"><i class="fa fa-tag" style="margin-right: 5px;"></i>dct:title</small></label>
        <div class="col-sm-9"><input type="text" name="dctTitle" id="dctTitle" disabled class="form-control" value="<c:out value="${resultMap.dctTitle}"/>"></div>
   </div>
   
	<div class="hr-line-dashed"></div>
	<div class="form-group row">
		<label class="col-sm-2 col-form-label">접근권한 <br/>
	       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>dct:accessRights</small></label>
	       		<div class="col-sm-9">
               		<select class="form-control m-b" disabled name="dctAccessrights" id="dctAccessrights">
               			  
                          <option <c:if test="${resultMap.dctAccessrights eq 'public'}">selected</c:if> value="public">public</option>
                          <option <c:if test="${resultMap.dctAccessrights eq 'private'}">selected</c:if> value="private">private</option>
                          <option <c:if test="${resultMap.dctAccessrights eq 'commercial'}">selected</c:if> value="commercial">commercial</option>
                          <option <c:if test="${resultMap.dctAccessrights eq 'internal'}">selected</c:if> value="internal">internal</option>
                     </select>
	       		</div>
    </div>	
   
	<div class="hr-line-dashed"></div>
	<div class="form-group row" style="height:auto;">
		<label class="col-sm-2 col-form-label">데이터셋 설명<br/>
	       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>dct:description</small></label>
	        <div class="col-sm-9">
	        	<textarea style="height:100px;"name="dctDescription" id="dctDescription"class="form-control" disabled><c:out value="${resultMap.dctDescription}"/></textarea>
	        	</div>
   </div>
	   
	<div class="hr-line-dashed"></div>
	<div class="form-group row">
		<label class="col-sm-2 col-form-label">주제분류 카테고리 <br/>
	       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>dcat:theme</small></label>
	       		<div class="col-sm-9">
               		<select class="form-control m-b" disabled name="dcatTheme" id="dcatTheme">
                          <option value="차량이동" <c:if test="${resultMap.dcatTheme eq '차량이동'}">selected</c:if>>차량이동</option>
                          <option value="사람이동" <c:if test="${resultMap.dcatTheme eq '사람이동'}">selected</c:if>>사람이동</option>
                          <option value="행태분석" <c:if test="${resultMap.dcatTheme eq '행태분석'}">selected</c:if>>행태분석</option>
                          <option value="공간정보" <c:if test="${resultMap.dcatTheme eq '공간정보'}">selected</c:if>>공간정보</option>
                     	</select>
	       		</div>
   </div>
	   
   <div class="hr-line-dashed"></div>
	<div class="form-group row">
		<label class="col-sm-2 col-form-label">키워드 <br/>
	       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>dcat:keyword</small></label>
	        <div class="col-sm-9">
	        	<input type="text" name="dcatKeyword" id="dcatKeyword" disabled class="form-control" value="<c:out value="${resultMap.dcatKeyword}"/>">
	        	<span class="form-text m-b-none frm-add-span">
        			<small><i class="fa fa-exclamation-circle"></i>키워드는 꼭 쉼표(,)로 구분해주세요.</small>
        		</span>
	        </div>
   </div>
   
   <div class="hr-line-dashed"></div>
	<div class="form-group row">
		<label class="col-sm-2 col-form-label">판매가격 <br/>
	       <small class="text-navy"><i class="fa fa-tags" style="margin-right: 5px;"></i>priceinfo</small></label>
	        <div class="col-sm-9">
	        	<input type="text" name="priceinfo" id="priceinfo" disabled class="form-control" value="<c:out value="${resultMap.priceinfo}"/>">
	        	<span class="form-text m-b-none frm-add-span">
        			<small><i class="fa fa-exclamation-circle"></i>접근권한이 commercial(상용)일 경우에만 입력하실 수 있습니다.</small>
        		</span>
	        </div>
   </div>
   
   
   <div class="hr-line-dashed"></div>
</form>