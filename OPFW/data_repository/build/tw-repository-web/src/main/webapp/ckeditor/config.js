/**
 * @license Copyright (c) 2003-2015, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here. For example:
	
	config.docType = "<!DOCTYPE html>";			//문서타입 설정S
	config.startupFocus = false;				//시작시 포커스 설정
	config.toolbarCanCollapse = true;		    //툴바가 접히는 기능을 넣을때 사용합니다.
	config.allowedContent = true;               //콘텐츠 유지(태그탈락 방지)
	
	//config.contentsCss = ['/css/custom.css', '콘텐츠전용.css'];
	config.contentsCss = ['/css/bootstrap.css'];
	config.enterMode = CKEDITOR.ENTER_BR;		//엔터태그 <BR>
	config.language = 'ko';						//언어설정
	config.font_names = '나눔고딕; 굴림; 돋움; 궁서; HY견고딕; HY견명조; 휴먼둥근헤드라인;' 
		              + '휴먼매직체; 휴먼모음T; 휴먼아미체; 휴먼엑스포; 휴먼옛체; 휴먼편지체;' 
		              + CKEDITOR.config.font_names;
	//config.uiColor = '#EEEEEE';				//Editor 색상
	//config.height = '300px';					//Editor 높이  
	//config.width = '777px';					//Editor 넓이
	//config.removeDialogTabs = 'link:upload;image:Upload';
	config.filebrowserUploadUrl = '/file/ckeditor/upload.json';
//	config.filebrowserImageUploadUrl  = '/system/media/insert.json';
	config.extraPlugins = 'find,justify,colordialog,save,ccl';
	config.resize_maxWidth = 300;
	config.resize_maxHeight = 600;
	config.resize_minWidth = 300;
	config.resize_minHeight = 400;
	config.image_previewText = "이미지를 업로드 하면 이 곳에 표시 됩니다."
		
		
	/* default toolbar
	config.toolbar = [
	              	['Source','-','Save','NewPage','Preview','-','Templates'],
	              	['Cut','Copy','Paste','PasteText','PasteFromWord','-','Print','SpellChecker', 'Scayt'],
	              	['Undo','Redo','-','Find','Replace','-','SelectAll','RemoveFormat'],
	              	['Form', 'Checkbox', 'Radio','TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'],'/',
	              	['Bold','Italic','Underline','Strike','-','Subscript','Superscript'],
	              	['NumberedList','BulletedList','-','Outdent','Indent','Blockquote'],
	              	['JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock'],['Link','Unlink','Anchor'],
	              	['Image','Flash','Table','HorizontalRule','Smiley','SpecialChar','PageBreak'],'/',
	              	['Styles','Format','Font','FontSize'],['TextColor','BGColor'],['Maximize', 'ShowBlocks','-','About']
	              	];
	*/
	
	config.toolbar = [
	                  	['Source','-','NewPage','Preview','-','Templates', 'Print'],
		              	//['Cut','Copy','Paste','PasteText','PasteFromWord','-','Print','SpellChecker', 'Scayt'],
		              	['Find','Replace'],
		              	//['Form', 'Checkbox', 'Radio','TextField', 'Textarea', 'Select', 'Button', 'ImageButton', 'HiddenField'],'/',
		              	['Bold','Italic','Underline','Strike','-','Subscript','Superscript'],
		              	['NumberedList','BulletedList','-','Outdent','Indent','Blockquote'],
		              	//['Link','Unlink','Anchor'],
		              	['Ccl','Image','Flash','Table','HorizontalRule','Smiley','SpecialChar','PageBreak'],'/',
		              	['Styles','Format','Font','FontSize'],
		              	['TextColor','BGColor'], ['JustifyLeft','JustifyCenter','JustifyRight','JustifyBlock']
		              	//['Maximize', 'ShowBlocks','-','About']
	                 ];
	
};
