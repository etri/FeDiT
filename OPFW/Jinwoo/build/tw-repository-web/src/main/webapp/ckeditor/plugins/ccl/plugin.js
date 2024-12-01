CKEDITOR.plugins.add('ccl', {
icons : 'ccl',
init : function(editor) {
	editor.addCommand('cclCommand', {
		exec : function(editor) {
			selectEditor = editor;
			window.open('/system/media/image.mng', 'copyright', 'width=985,height=790');
		/*
			window.addCCL = function(data) {
				alert(message)
				if(data.mediaType == 'image/jpeg') {
					editor.insertHtml('<img src="'+media.hash+'"  alt="'+data.name+'">');
				} else {
					// TODO: add default action
					//editor.insertHtml('<img src="'+media.thumb+'" alt="'+media.name+'">');
				}

				if (typeof window.onAddMedia !="undefined") {
					window.onAddMedia(media);
				}
			};*/
		}
	});
	editor.ui.addButton('Ccl', {
		label : '저작권 관리 실행',
		command : 'cclCommand',
		toolbar : 'insert,0'
	});
}
});