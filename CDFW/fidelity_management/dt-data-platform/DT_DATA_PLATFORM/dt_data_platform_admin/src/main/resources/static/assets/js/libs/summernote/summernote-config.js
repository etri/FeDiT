(function() {
    'use strict'
    $(document).ready(function() {
    	//span 자동추가 수정 (크롬)
    	/*
    	$(document).on("DOMNodeInserted", '.note-editable', function (e) {
    	    if (e.target.tagName === "SPAN") {
    	        $(e.target).replaceWith($(e.target).contents());
    	    }
    	});
    	*/
    	
    	var blanktag = function (context) {
			var ui = $.summernote.ui;			
			var button = ui.button({
				contents: '<i class="fa fa-i-cursor"/>',
				tooltip: '작성',
				container: 'body',
				click: function () {					
					context.invoke('editor.pasteHTML', '<span>입력</span>');					
				}
			});
			return button.render();
		};
		
		
    	/*
    	var hrLine = function (context) {
			var ui = $.summernote.ui;			
			var button = ui.button({
				contents: '<i class="fa fa-minus"/>',
				tooltip: '구분선2',
				container: 'body',
				click: function () {					
					context.invoke('editor.pasteHTML', '<hr style="border-width:5px">');
				}
			});
			return button.render();
		};
		*/
    	
    	$('#editor').summernote({
			lang: 'ko-KR',			
			placeholder: '내용을 입력하세요',
			tabsize: 2,
			height: 400,
			fontSizeUnits: ['px', 'pt'],
			tabDisable: true,
			disableDragAndDrop: false,
			codemirror: {
				mode: 'text/html',
				htmlMode: true,
				lineNumbers: true,						
				theme: 'monokai'
			},
			prettifyHtml: true,	//코드보기 newline
			//styleWithSpan: false,
			fontNames: ['맑은 고딕','궁서체','HY견고딕','Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Merriweather'],			
			//fontNamesIgnoreCheck: ['Merriweather','궁서체'],
			styleTags: [
				//'p', 
				{title:'인용구1', tag:'blockquote', className:'edt-blockquote-1', value:'blockquote' },
				{title:'인용구2', tag:'blockquote', className:'edt-blockquote-2', value:'blockquote' },
				{title:'코드', tag:'pre', className:'edt-code', value:'pre' },
				//'pre', //'h1', 'h2', 'h3', 'h4', 'h5', 'h6'				
			],
			
			/*
			addclass: {
		        debug: false,
		        classTags: [{title:"Button",value:"btn btn-success"},"jumbotron", "lead","img-rounded","img-circle", "img-responsive","btn", "btn btn-success","btn btn-danger","text-muted", "text-primary", "text-warning", "text-danger", "text-success", "table-bordered", "table-responsive", "alert", "alert alert-success", "alert alert-info", "alert alert-warning", "alert alert-danger", "visible-sm", "hidden-xs", "hidden-md", "hidden-lg", "hidden-print"]
		    },
		    */
				
		    addclassfontcolor: {
		        debug: true,
		        classTags: ["edt-font-color-white", "edt-font-color-red", "edt-font-color-blue", "edt-font-color-green", "edt-font-color-yellow", "edt-font-color-grey"]
		    },
		    
		    addclassfontalign: {
		        debug: true,
		        classTags: [{tag:"div", title:"기본", value:"edt-text-align-justify"}, {tag:"div", title:"왼쪽", value:"edt-text-align-left"}, {tag:"div", title:"가운데", value:"edt-text-align-center"}, {tag:"div", title:"오른쪽", value:"edt-text-align-right"}]
		    },
		    
		    addclassfontsize: {
		        debug: true,
		    	classTags: [{tag:"div", title:"텍스트",value:"edt-font-size-mb32"}, {tag:"div", title:"텍스트",value:"edt-font-size-b24"}, {tag:"div", title:"텍스트(기본)",value:"edt-font-size-d20"}, {tag:"div", title:"텍스트",value:"edt-font-size-n16"}, {tag:"div", title:"텍스트",value:"edt-font-size-s12"}, {tag:"div", title:"텍스트",value:"edt-font-size-ms8"}]
		    },
		    
		    addclasshr: {
		        debug: true,
		        classTags: ["edt-board-height-b3", "edt-board-height-n2", "edt-board-height-s1"]
		    },
		    
		    addclasslineheight: {
		        debug: true,
		        classTags: [{title:"1.9", value:"edt-line-height-b19"}, {title:"1.6(기본)", value:"edt-line-height-n16"}, {title:"1.3", value:"edt-line-height-s13"}]
		    },
		    
		    addclasstablesize: {
		        debug: true,		        
		    	classTags: [{title:"대-100%", value:"edt-table-size-l100"}, {title:"중-50%", value:"edt-table-size-n50"}, {title:"소-25%", value:"edt-table-size-s25"}]
		    },
		    
		    addclasstablealign: {
		        debug: true,		        
		    	classTags: [{title:"왼쪽", value:"edt-table-align-left"}, {title:"가운데", value:"edt-table-align-center"}, {title:"오른쪽", value:"edt-table-align-right"}]
		    },
		    
		    /*
		    tableClassName: function() {
		        this.className = 'table table-bordered1';
		        this.style.cssText = '';
		    },
		    */
		    
			//툴바
			toolbar: [
				['style', ['style']],
				['font', ['addclassfontcolor', 'addclassfontsize', 'addclassfontalign']],
				['custom', ['blanktag', 'addclasshr']],
				['font', ['bold', 'underline', 'italic', 'strikethrough', 'superscript', 'subscript', 'clear']], //'forecolor',
				//['font', ['fontname', 'fontsize', 'fontsizeunit', 'bold', 'underline', 'italic', 'color', 'forecolor', 'backcolor', 'strikethrough', 'superscript', 'subscript', 'clear']],
				//['color', ['color']],
				['para', ['ul', 'ol', 'addclasslineheight']], /*'paragraph', 'height' */
				['table', ['table','addclasstablesize','addclasstablealign']],
				['insert', ['link', 'picture', 'video']], //'hr'				
				['view', ['undo', 'redo', 'codeview']],
				['custom', ['specialchars']] //'hrLine', 'specialchars'
			],
			
			//서브메뉴
			popover: {
				image: [
					['image', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
					['float', ['floatLeft', 'floatRight', 'floatNone']],
					['remove', ['removeMedia']]
				],
				link: [
					['link', ['linkDialogShow', 'unlink']]
				],
				table: [
					['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
					['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
				]				
			},
			
			//커스텀 버튼
			buttons: {
				//hrLine: hrLine,				
				blanktag: blanktag,
			},
			
			//콜백
			callbacks: {
				onImageUpload : function(files) {
					imageFileUpload(files,this);
				},
				
				onChange: function(contents, $editable) {
					//b -> strong 변경
					if ($editable.find('b')!=="undefined") {
						$editable.find('b').contents().unwrap().wrap('<strong></strong>');
					}
										
					//span 구글에서는 자동으로 붙는 현상이 있음
					if ($editable.find('span').attr('style')!=="undefined") {
						$editable.find('span').removeAttr('style');
					}
				},
				
				/*
				onPaste: function (e) {
					var clipboardData = e.originalEvent.clipboardData;
					if (clipboardData && clipboardData.items && clipboardData.items.length) {
						var item = clipboardData.items[0];
						if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
							e.preventDefault();
						}
					}
				}
				*/				
			}
		});
    	
		//이미지 업로드
		function imageFileUpload(files, editor) {			
			for (var i=0; i < files.length; i++) {
				var param = new FormData();
				param.append("file", files[i]);
				param.append("type", $(location).attr('pathname'));
				
				$.ajax({
					data : param,
					type : "POST",
					url : "/resource/imageFileUpload",
					contentType : false,
					processData : false,
					success : function(data) {							
						var url = data.domain + data.url;
						console.log(url);						
						$(editor).summernote('insertImage', url);
					}
				});
			} 			
		}
		
    });
})();

