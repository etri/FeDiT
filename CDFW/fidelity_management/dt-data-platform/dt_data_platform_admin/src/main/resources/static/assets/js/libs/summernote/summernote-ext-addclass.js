/**
 * 
 * copyright 2016 creativeprogramming.it di Stefano Gargiulo
 * email: info@creativeprogramming.it
 * accepting tips at https://www.paypal.me/creativedotit 
 * license: MIT
 * 
 */
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('jquery'));
    } else {
        factory(window.jQuery);
    }
}(function ($) {
    // Extends plugins for adding hello.
    //  - plugin is external module for customizing.
    $.extend($.summernote.plugins, {
        /**
         * @param {Object} context - context object has status of editor.
         */
    	/*
        'addclass': function (context) {
            var self = this;
            if (typeof context.options.addclass === 'undefined') {
                context.options.addclass = {};
            }
            if (typeof context.options.addclass.classTags === 'undefined') {
                context.options.addclass.classTags = ["jumbotron", "lead","img-rounded","img-circle", "img-responsive","btn", "btn btn-success","btn btn-danger","text-muted", "text-primary", "text-warning", "text-danger", "text-success", "table-bordered", "table-responsive", "alert", "alert alert-success", "alert alert-info", "alert alert-warning", "alert alert-danger", "visible-sm", "hidden-xs", "hidden-md", "hidden-lg", "hidden-print"];
                //  console.log("Please define your summernote.options.addclass.classTags array");
            }
            // ui has renders to build ui elements.
            //  - you can create a button with `ui.button`
            var ui = $.summernote.ui;

            addStyleString(".scrollable-menu {height: auto; max-height: 200px; max-width:300px; overflow-x: hidden;}");

            context.memo('button.addclass', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-toggle',                        
                        contents: '<i class="fa fa-css3"\/>' + ' ' + ui.icon(context.options.icons.caret, 'span'),
                        //ui.icon(context.options.icons.magic) + ' ' + ui.icon(context.options.icons.caret, 'span'),
                        container: 'body',
                        tooltip: 'toggle CSS class', //lang.style.style,
                        data: {
                            toggle: 'dropdown'
                        }
                    }),
                    ui.dropdown({
                        className: 'dropdown-style scrollable-menu',
                        items: context.options.addclass.classTags,
                        template: function (item) {

                            if (typeof item === 'string') {
                                item = {tag: "div", title: item, value: item};
                            }

                            var tag = item.tag;
                            var title = item.title;
                            var style = item.style ? ' style="' + item.style + '" ' : '';
                            var cssclass = item.value ? ' class="' + item.value + '" ' : '';
                   

                            return '<' + tag + ' ' + style + cssclass + '>' + title + '</' + tag + '>';
                        },
                        click: function (event, namespace, value) {

                            event.preventDefault();
                            value = value || $(event.target).closest('[data-value]').data('value');



                            var $node = $(context.invoke("restoreTarget"))
                            if ($node.length==0){
                                $node = $(document.getSelection().focusNode.parentElement, ".note-editable");
                            }
                            
                            if (typeof context.options.addclass !== 'undefined' && typeof context.options.addclass.debug !== 'undefined' && context.options.addclass.debug) {
                                console.debug(context.invoke("restoreTarget"), $node, "toggling class: " + value, window.getSelection());
                            }


                            $node.toggleClass(value)


                        }
                    })
                ]).render();
                return $optionList;
            });

            function addStyleString(str) {
                var node = document.createElement('style');
                node.innerHTML = str;
                document.body.appendChild(node);
            }

            // This events will be attached when editor is initialized.
            this.events = {
                // This will be called after modules are initialized.
                'summernote.init': function (we, e) {
                    //console.log('summernote initialized', we, e);
                },
                // This will be called when user releases a key on editable.
                'summernote.keyup': function (we, e) {
                    //  console.log('summernote keyup', we, e);
                }
            };

            // This method will be called when editor is initialized by $('..').summernote();
            // You can create elements for plugin
            this.initialize = function () {

            };

            // This methods will be called when editor is destroyed by $('..').summernote('destroy');
            // You should remove elements on `initialize`.
            this.destroy = function () {
                 //this.$panel.remove();
                 //this.$panel = null;
            };
        },
    	*/

    	//폰트컬러
	    'addclassfontcolor': function (context) {
	        var self = this;
	        if (typeof context.options.addclassfontcolor === 'undefined') {
	            context.options.addclassfontcolor = {};
	        }
	        if (typeof context.options.addclassfontcolor.classTags === 'undefined') {
	            context.options.addclassfontcolor.classTags = ["edt-font-color-white","edt-font-color-red", "edt-font-color-blue", "edt-font-color-green", "edt-font-color-yellow", "edt-font-color-grey"];
	        }

	        var ui = $.summernote.ui;
	        addStyleString(".scrollable-menu1 {height: auto; max-height: 200px; max-width:300px; overflow-x: hidden;}");
	        context.memo('button.addclassfontcolor', function () {
	            return ui.buttonGroup([
	            	//툴바버튼 생성
	                ui.button({
	                    className: 'dropdown-toggle1',                        
	                    contents: '<i class="fa fa-font"\/>' + ' ' + ui.icon(context.options.icons.caret, 'span'),
	                    container: 'body',
	                    tooltip: '폰트컬러',	                    
	                    data: {
	                        toggle: 'dropdown'
	                    }
	                }),
	                
	                //드랍다운 목록
	                ui.dropdown({	                	
	                    className: 'dropdown-style scrollable-menu1',
	                    items: context.options.addclassfontcolor.classTags,
	                    template: function (item) {
	                    	if (typeof item === 'string') {
	                            item = {tag: "div", title: item, value: item};
	                        }
	
	                    	var icon = getIcon(item.value);
	                        var tag = item.tag;
	                        var title = item.title;
	                        var style = item.style ? ' style="' + item.style + '" ' : '';
	                        var cssclass = item.value ? ' class="' + item.value + '" ' : '';
	                        
	                        return icon + '<' + tag + ' ' + style + cssclass + '>' + title + '</' + tag + '>';
	                    },	                    
	                    //클릭이벤트
	                    click: function (event, namespace, value) {
	                    	event.preventDefault();
	                    	
	                    	value = value || $(event.target).closest('[data-value]').data('value');
	                    	if (typeof value==='undefined' || value==="")
	                    		return;
	                    	
	                        var $node = $(context.invoke("restoreTarget"))
	                        if ($node.length==0){
	                            $node = $(document.getSelection().focusNode.parentElement, ".note-editable");
	                        }
	                        
	                        if (typeof context.options.addclassfontcolor !== 'undefined' && typeof context.options.addclassfontcolor.debug !== 'undefined' && context.options.addclassfontcolor.debug) {
	                            console.debug(context.invoke("restoreTarget"), $node, "toggling class: " + value, window.getSelection());
	                        }
	                        
	                        //선택/미선택시 스타일 적용
	                        var text = context.invoke('editor.getSelectedText');	                        
	                    	if (text !== "") {
	                    		var $node = $('<span class="' + value +'">'+text+'</span>');
	                    		context.invoke('editor.insertNode', $node[0]);	                    		
	                    	} else {
	                    		clearClass(context.options.addclassfontcolor.classTags, $node);
		                        $node.toggleClass(value)
	                    	}
	                    		                    	
	                        //if ($node[0].nodeName.toLowerCase() !== "p")	                        	
	                        //	return;
	                        	
	                        //clearClass(context.options.addclassfontcolor.classTags, $node);
	                        //$node.toggleClass(value)
	                        
	                        /* 선택/미선택 스타일지정
	                        if ($node.hasClass(value) === true) {
	                        	$(event.target).css("font-weight","bold");
	                        } else {
	                        	$(event.target).css("font-weight","initial");
	                        }
	                        */
	                    }
	                })
	            ]).render();
	            return $optionList;
	        });
	
	        function addStyleString(str) {
	            var node = document.createElement('style');
	            node.innerHTML = str;
	            document.body.appendChild(node);
	        }
	
	        // This events will be attached when editor is initialized.
	        this.events = {
	            // This will be called after modules are initialized.
	            'summernote.init': function (we, e) {
	                //console.log('summernote initialized', we, e);
	            },
	            // This will be called when user releases a key on editable.
	            'summernote.keyup': function (we, e) {
	                //  console.log('summernote keyup', we, e);
	            }
	        };
	
	        // This method will be called when editor is initialized by $('..').summernote();
	        // You can create elements for plugin
	        this.initialize = function () {
	
	        };
	
	        // This methods will be called when editor is destroyed by $('..').summernote('destroy');
	        // You should remove elements on `initialize`.
	        this.destroy = function () {
	            /*  this.$panel.remove();
	             this.$panel = null; */
	        };
	    },

	    //텍스트정렬
        'addclassfontalign': function (context) {
	        var self = this;
	        if (typeof context.options.addclassfontalign === 'undefined') {
	            context.options.addclassfontalign = {};
	        }
	        if (typeof context.options.addclassfontalign.classTags === 'undefined') {
	            context.options.addclassfontalign.classTags = ["edt-text-align-justify", "edt-text-align-left", "edt-text-align-center", " edt-text-align-right"];
	        }
	        
	        var ui = $.summernote.ui;
	        addStyleString(".scrollable-menu2 {height: auto; max-height: 200px; max-width:300px; overflow-x: hidden;}");
	        context.memo('button.addclassfontalign', function () {
	            return ui.buttonGroup([
	            	//툴바버튼생성
	                ui.button({
	                    className: 'dropdown-toggle2',                        
	                    contents: '<i class="fa fa-align-left"\/>' + ' ' + ui.icon(context.options.icons.caret, 'span'),
	                    container: 'body',
	                    tooltip: '텍스트정렬',	                    
	                    data: {
	                        toggle: 'dropdown'
	                    }
	                }),
	                //드랍다운 목록
	                ui.dropdown({	                	
	                    className: 'dropdown-style scrollable-menu2',
	                    items: context.options.addclassfontalign.classTags,
	                    template: function (item) {
	                    	if (typeof item === 'string') {
	                            item = {icon: item, tag: "div", title: item, value: item};
	                        }
	                    		                  
	                    	/* 아이콘 설정시 활용
	                    	var icon; 
	                    	if (item.icon!=='undefined') {	                    		
	                    		icon = '<i class="' + item.icon + '"\/>';
	                    	}
	                    	*/
	                    	
	                        var tag = item.tag;
	                        var title = item.title;
	                        var style = item.style ? ' style="' + item.style + '" ' : '';
	                        var cssclass = item.value ? ' class="' + item.value + '" ' : '';
	                        		                        
	                        return '<' + tag + ' ' + style + cssclass + '>' + title + '</' + tag + '>';	                        
	                    },
	                    //클릭이벤트
	                    click: function (event, namespace, value) {
	                    	event.preventDefault();
	                    	
	                    	value = value || $(event.target).closest('[data-value]').data('value');
	                    	if (typeof value==='undefined' || value==="")
	                    		return;
	                    	
	                        var $node = $(context.invoke("restoreTarget"))	                        
	                        if ($node.length==0){
	                            $node = $(document.getSelection().focusNode.parentElement, ".note-editable");
	                        }
	                        
	                        if (typeof context.options.addclassfontalign !== 'undefined' && typeof context.options.addclassfontalign.debug !== 'undefined' && context.options.addclassfontalign.debug) {
	                            console.debug(context.invoke("restoreTarget"), $node, "toggling class: " + value, window.getSelection());
	                        }
	                        	                        
	                        //if ($node[0].nodeName.toLowerCase() !== "p")	                        	
	                        //	return;
	                        	
	                        //clearClass(context.options.addclassfontalign.classTags, $node);
	                        //$node.toggleClass(value)
	                        	       
	                        //console.log(document.getSelection());
	                        //console.log($(document.getSelection().anchorNode)[0].tagName.toLowerCase());
	                        
	                        var $tag = $(document.getSelection().anchorNode);
	                        //console.log($tag);	                        
	                        if (typeof $tag[0].tagName !=="undefined" && $tag[0].tagName.toLowerCase() == 'p') {
	                        	clearClass(context.options.addclassfontalign.classTags, $tag);
	                        	$tag.toggleClass(value);
	                        } else {
	                        	var $tag = $(closestTag(document.getSelection().focusNode.parentElement, 'p', 'note-editing-area'));	                        
		                        if ($tag !== null) {	                        	
		                        	clearClass(context.options.addclassfontalign.classTags, $tag);
		                        	$tag.toggleClass(value);	                        	
		                        }
	                        }	                       
	                    }
	                })
	            ]).render();
	            return $optionList;
	        });
	
	        function addStyleString(str) {
	            var node = document.createElement('style');
	            node.innerHTML = str;
	            document.body.appendChild(node);
	        }
	
	        // This events will be attached when editor is initialized.
	        this.events = {
	            // This will be called after modules are initialized.
	            'summernote.init': function (we, e) {
	                //console.log('summernote initialized', we, e);
	            },
	            // This will be called when user releases a key on editable.
	            'summernote.keyup': function (we, e) {
	                //  console.log('summernote keyup', we, e);
	            }
	        };
	
	        // This method will be called when editor is initialized by $('..').summernote();
	        // You can create elements for plugin
	        this.initialize = function () {
	
	        };
	
	        // This methods will be called when editor is destroyed by $('..').summernote('destroy');
	        // You should remove elements on `initialize`.
	        this.destroy = function () {
	            /*  this.$panel.remove();
	             this.$panel = null; */
	        };
	    },
	    
	    //폰트사이즈
	    'addclassfontsize': function (context) {
	        var self = this;
	        if (typeof context.options.addclassfontsize === 'undefined') {
	            context.options.addclassfontsize = {};
	        }
	        if (typeof context.options.addclassfontsize.classTags === 'undefined') {
	            context.options.addclassfontsize.classTags = ["edt-font-size-mb32", "edt-font-size-b24", "edt-font-size-d20", "edt-font-size-n16", "edt-font-size-s12", "edt-font-size-ms8"];
	        }

	        var ui = $.summernote.ui;
	        addStyleString(".scrollable-menu3 {height: auto; max-height: 200px; max-width:300px; overflow-x: hidden;}");
	        context.memo('button.addclassfontsize', function () {
	            return ui.buttonGroup([
	            	//툴바버튼생성
	                ui.button({
	                    className: 'dropdown-toggle3',                        
	                    contents: '<i class="fa fa-text-height"\/>' + ' ' + ui.icon(context.options.icons.caret, 'span'),
	                    container: 'body',
	                    tooltip: '폰트크기',	                    
	                    data: {
	                        toggle: 'dropdown'
	                    }
	                }),
	                //드랍다운 목록
	                ui.dropdown({
	                    className: 'dropdown-style scrollable-menu3',
	                    items: context.options.addclassfontsize.classTags,
	                    template: function (item) {
	                    	if (typeof item === 'string') {	                    		
	                            item = {tag: "div", title: item, value: item};
	                        }
	                    	 
	                        var tag = item.tag;
	                        var title = item.title;
	                        var style = item.style ? ' style="' + item.style + '" ' : '';
	                        var cssclass = item.value ? ' class="' + item.value + '" ' : '';
	                        	                        
	                        return '<' + tag + ' ' + style + cssclass + '>' + title + '</' + tag + '>';
	                    },
	                    //클릭이벤트
	                    click: function (event, namespace, value) {
	                    	event.preventDefault();
	                    	
	                    	value = value || $(event.target).closest('[data-value]').data('value');
	                    	if (typeof value==='undefined' || value==="")
	                    		return;
	                    	
	                        var $node = $(context.invoke("restoreTarget"))	                        
	                        if ($node.length==0){
	                            $node = $(document.getSelection().focusNode.parentElement, ".note-editable");
	                        }
	                        
	                        if (typeof context.options.addclassfontsize !== 'undefined' && typeof context.options.addclassfontsize.debug !== 'undefined' && context.options.addclassfontsize.debug) {
	                            console.debug(context.invoke("restoreTarget"), $node, "toggling class: " + value, window.getSelection());
	                        }
	                        	       
	                        //선택/미선택시 스타일 적용
	                        var text = context.invoke('editor.getSelectedText');	                        
	                    	if (text !== "") {
	                    		var $node = $('<span class="' + value +'">'+text+'</span>');
	                    		context.invoke('editor.insertNode', $node[0]);	                    		
	                    	} else {
	                    		clearClass(context.options.addclassfontsize.classTags, $node);
		                        $node.toggleClass(value)
	                    	}
	                    	
	                        //if ($node[0].nodeName.toLowerCase() !== "p")	                        	
	                        //	return;
	                       
	                        //clearClass(context.options.addclassfontsize.classTags, $node);
	                        //$node.toggleClass(value)	                        
	                    }
	                })
	            ]).render();
	            return $optionList;
	        });
	
	        function addStyleString(str) {
	            var node = document.createElement('style');
	            node.innerHTML = str;
	            document.body.appendChild(node);
	        }
	
	        // This events will be attached when editor is initialized.
	        this.events = {
	            // This will be called after modules are initialized.
	            'summernote.init': function (we, e) {
	                //console.log('summernote initialized', we, e);
	            },
	            // This will be called when user releases a key on editable.
	            'summernote.keyup': function (we, e) {
	                //  console.log('summernote keyup', we, e);
	            }
	        };
	
	        // This method will be called when editor is initialized by $('..').summernote();
	        // You can create elements for plugin
	        this.initialize = function () {
	
	        };
	
	        // This methods will be called when editor is destroyed by $('..').summernote('destroy');
	        // You should remove elements on `initialize`.
	        this.destroy = function () {
	            /*  this.$panel.remove();
	             this.$panel = null; */
	        };
	    },
	    	    
	    //구분선
	    'addclasshr': function (context) {
	        var self = this;
	        if (typeof context.options.addclasshr === 'undefined') {
	            context.options.addclasshr = {};
	        }
	        if (typeof context.options.addclasshr.classTags === 'undefined') {
	            context.options.addclasshr.classTags = ["edt-board-height-b3", "edt-board-height-n2", "edt-board-height-s1"];
	        }
	        
	        var ui = $.summernote.ui;
	        addStyleString(".scrollable-menu4 {height: auto; max-height: 200px; max-width:300px; overflow-x: hidden;}");
	        context.memo('button.addclasshr', function () {
	            return ui.buttonGroup([
	            	//툴바버튼생성
	                ui.button({
	                    className: 'dropdown-toggle4',                        
	                    contents: '<i class="fa fa-minus"\/>' + ' ' + ui.icon(context.options.icons.caret, 'span'),
	                    container: 'body',
	                    tooltip: '구분선',	                    
	                    data: {
	                        toggle: 'dropdown'
	                    }
	                }),
	                //드랍다운 목록
	                ui.dropdown({
	                    className: 'dropdown-style scrollable-menu4',
	                    items: context.options.addclasshr.classTags,
	                    template: function (item) {
	                    	if (typeof item === 'string') {	                    		
	                            item = {tag: "hr", title: item, value: item};
	                        }
	                    	 
	                    	var tag = item.tag;
	                        var title = item.title;
	                        var style = item.style ? ' style="' + item.style + '" ' : '';
	                        var cssclass = item.value ? ' class="' + item.value + '" ' : '';
	                        	 	                        
	                        return '<div style="height:20px"><' + tag + cssclass + ' style="margin:0px"> ' + '' + '</' + tag + '></div>';
	                    },
	                    //클릭이벤트
	                    click: function (event, namespace, value) {
	                    	event.preventDefault();
	                    	
	                    	value = value || $(event.target).closest('[data-value]').data('value');
	                    	if (typeof value==='undefined' || value==="")
	                    		return;
	                    	
	                    	context.invoke('editor.pasteHTML', '<hr class=' + value + '>');	                    	                     
	                    }
	                })
	            ]).render();
	            return $optionList;
	        });
	
	        function addStyleString(str) {
	            var node = document.createElement('style');
	            node.innerHTML = str;
	            document.body.appendChild(node);
	        }
	
	        // This events will be attached when editor is initialized.
	        this.events = {
	            // This will be called after modules are initialized.
	            'summernote.init': function (we, e) {
	                //console.log('summernote initialized', we, e);
	            },
	            // This will be called when user releases a key on editable.
	            'summernote.keyup': function (we, e) {
	                //  console.log('summernote keyup', we, e);
	            }
	        };
	
	        // This method will be called when editor is initialized by $('..').summernote();
	        // You can create elements for plugin
	        this.initialize = function () {
	
	        };
	
	        // This methods will be called when editor is destroyed by $('..').summernote('destroy');
	        // You should remove elements on `initialize`.
	        this.destroy = function () {
	            /*  this.$panel.remove();
	             this.$panel = null; */
	        };
	    },
	    
	    //줄간격
	    'addclasslineheight': function (context) {
	        var self = this;
	        if (typeof context.options.addclasslineheight === 'undefined') {
	            context.options.addclasslineheight = {};
	        }
	        if (typeof context.options.addclasslineheight.classTags === 'undefined') {
	            context.options.addclasslineheight.classTags = ["default","edt-line-height-b19", "edt-line-height-n16", "edt-line-height-s13"];
	        }

	        var ui = $.summernote.ui;
	        addStyleString(".scrollable-menu5 {height: auto; max-height: 200px; max-width:300px; overflow-x: hidden;}");
	        context.memo('button.addclasslineheight', function () {
	            return ui.buttonGroup([
	            	//툴바버튼생성
	                ui.button({
	                    className: 'dropdown-toggle5',                        
	                    contents: '<i class="fa fa-bars"\/>' + ' ' + ui.icon(context.options.icons.caret, 'span'),
	                    container: 'body',
	                    tooltip: '줄간격',	                    
	                    data: {
	                        toggle: 'dropdown'
	                    }
	                }),
	                //드랍다운 목록
	                ui.dropdown({
	                    className: 'dropdown-style scrollable-menu5',
	                    items: context.options.addclasslineheight.classTags,
	                    template: function (item) {
	                    	if (typeof item === 'string') {	                    		
	                            item = {tag: "div", title: item, value: item};
	                        }

	                        var tag = item.tag;
	                        var title = item.title;
	                        var style = item.style ? ' style="' + item.style + '" ' : '';
	                        var cssclass = item.value ? ' class="' + item.value + '" ' : '';
	                        	                        
	                        return '<' + tag + ' ' + style + cssclass + '>' + title + '</' + tag + '>';
	                    },
	                    //클릭이벤트
	                    click: function (event, namespace, value) {
	                    	event.preventDefault();
	                    	
	                    	value = value || $(event.target).closest('[data-value]').data('value');
	                    	if (typeof value==='undefined' || value==="")
	                    		return;
	                    	
	                        var $node = $(context.invoke("restoreTarget"))	                        
	                        if ($node.length==0){
	                            $node = $(document.getSelection().focusNode.parentElement, ".note-editable");
	                        }
	                        
	                        if (typeof context.options.addclasslineheight !== 'undefined' && typeof context.options.addclasslineheight.debug !== 'undefined' && context.options.addclasslineheight.debug) {
	                            console.debug(context.invoke("restoreTarget"), $node, "toggling class: " + value, window.getSelection());
	                        }
	                        	                        
	                        //if ($node[0].nodeName.toLowerCase() !== "p")	                        	
	                        //	return;
	                       
	                        //clearClass(context.options.addclasslineheight.classTags, $node);
	                        //$node.toggleClass(value)
	                        
	                        var $tag = $(document.getSelection().anchorNode);
	                        //console.log($tag);	                        
	                        if (typeof $tag[0].tagName !=="undefined" && $tag[0].tagName.toLowerCase() == 'p') {
	                        	clearClass(context.options.addclasslineheight.classTags, $tag);	                        	
	                        	if (value=="default") { 
	                        		$tag.removeAttr('class');	                        	
	                        	} else {
	                        		$tag.toggleClass(value);
	                        	}	                        	
	                        } else {
	                        	var $tag = $(closestTag(document.getSelection().focusNode.parentElement, 'p', 'note-editing-area'));	                        
		                        if ($tag !== null) {	   		                        	
		                        	clearClass(context.options.addclasslineheight.classTags, $tag);		                        	
		                        	if (value=="default") { 
		                        		$tag.removeAttr('class');		                        	
		                        	} else {
		                        		$tag.toggleClass(value);
		                        	}
		                        }
	                        }	         
	                    }
	                })
	            ]).render();
	            return $optionList;
	        });
	
	        function addStyleString(str) {
	            var node = document.createElement('style');
	            node.innerHTML = str;
	            document.body.appendChild(node);
	        }
	
	        // This events will be attached when editor is initialized.
	        this.events = {
	            // This will be called after modules are initialized.
	            'summernote.init': function (we, e) {
	                //console.log('summernote initialized', we, e);
	            },
	            // This will be called when user releases a key on editable.
	            'summernote.keyup': function (we, e) {
	                //  console.log('summernote keyup', we, e);
	            }
	        };
	
	        // This method will be called when editor is initialized by $('..').summernote();
	        // You can create elements for plugin
	        this.initialize = function () {
	
	        };
	
	        // This methods will be called when editor is destroyed by $('..').summernote('destroy');
	        // You should remove elements on `initialize`.
	        this.destroy = function () {
	            /*  this.$panel.remove();
	             this.$panel = null; */
	        };
	    },
	   	    
	    //테이블크기
	    'addclasstablesize': function (context) {
	        var self = this;
	        if (typeof context.options.addclasstablesize === 'undefined') {
	            context.options.addclasstablesize = {};
	        }
	        if (typeof context.options.addclasstablesize.classTags === 'undefined') {
	            context.options.addclasstablesize.classTags = ["edt-table-size-l100", "edt-table-size-n50", "edt-table-size-s25"];
	        }

	        var ui = $.summernote.ui;
	        addStyleString(".scrollable-menu6 {height: auto; max-height: 200px; max-width:300px; overflow-x: hidden;}");
	        context.memo('button.addclasstablesize', function () {
	            return ui.buttonGroup([
	            	//툴바버튼생성
	                ui.button({
	                    className: 'dropdown-toggle6',                        
	                    contents: '<i class="fa fa-arrows-v"\/>' + ' ' + ui.icon(context.options.icons.caret, 'span'),
	                    container: 'body',
	                    tooltip: '표크기',	                    
	                    data: {
	                        toggle: 'dropdown'
	                    }
	                }),
	                //드랍다운 목록
	                ui.dropdown({
	                    className: 'dropdown-style scrollable-menu6',
	                    items: context.options.addclasstablesize.classTags,
	                    template: function (item) {
	                    	if (typeof item === 'string') {	                    		
	                            item = {tag: "div", title: item, value: item};
	                        }

	                        var tag = item.tag;
	                        var title = item.title;
	                        var style = item.style ? ' style="' + item.style + '" ' : '';
	                        var cssclass = item.value ? ' class="' + item.value + '" ' : '';
	                        	                        
	                        return '<' + tag + ' ' + style + cssclass + '>' + title + '</' + tag + '>';
	                    },
	                    //클릭이벤트
	                    click: function (event, namespace, value) {
	                    	event.preventDefault();
	                    	
	                    	value = value || $(event.target).closest('[data-value]').data('value');
	                    	if (typeof value==='undefined' || value==="")
	                    		return;
	                    	
	                        var $node = $(context.invoke("restoreTarget"))	                        
	                        if ($node.length==0){
	                            $node = $(document.getSelection().focusNode.parentElement, ".note-editable");
	                        }
	                        
	                        if (typeof context.options.addclasstablesize !== 'undefined' && typeof context.options.addclasstablesize.debug !== 'undefined' && context.options.addclasstablesize.debug) {
	                            console.debug(context.invoke("restoreTarget"), $node, "toggling class: " + value, window.getSelection());
	                        }
	                        	                        
	                        //if ($node[0].nodeName.toLowerCase() !== "p")	                        	
	                        //	return;
	                        	                        
	                        var $table = $(closest(document.getSelection().focusNode.parentElement, 'table table-bordered', 'body'));
	                        if ($table !== null) {
	                        	clearClass(context.options.addclasstablesize.classTags, $table);
	                        	$table.toggleClass(value);	                        	
	                        }
	                        	                        
	                        //clearClass(context.options.addclasstablesize.classTags, $node);
	                        //$node.toggleClass(value)	                        
	                    }
	                })
	            ]).render();
	            return $optionList;
	        });
	
	        function addStyleString(str) {
	            var node = document.createElement('style');
	            node.innerHTML = str;
	            document.body.appendChild(node);
	        }
	
	        // This events will be attached when editor is initialized.
	        this.events = {
	            // This will be called after modules are initialized.
	            'summernote.init': function (we, e) {
	                //console.log('summernote initialized', we, e);
	            },
	            // This will be called when user releases a key on editable.
	            'summernote.keyup': function (we, e) {
	                //  console.log('summernote keyup', we, e);
	            }
	        };
	
	        // This method will be called when editor is initialized by $('..').summernote();
	        // You can create elements for plugin
	        this.initialize = function () {
	
	        };
	
	        // This methods will be called when editor is destroyed by $('..').summernote('destroy');
	        // You should remove elements on `initialize`.
	        this.destroy = function () {
	            /*  this.$panel.remove();
	             this.$panel = null; */
	        };
	    },
	    
	    //테이블정렬
	    'addclasstablealign': function (context) {
	        var self = this;
	        if (typeof context.options.addclasstablealign === 'undefined') {
	            context.options.addclasstablealign = {};
	        }
	        if (typeof context.options.addclasstablealign.classTags === 'undefined') {
	            context.options.addclasstablealign.classTags = ["edt-table-align-left", "edt-table-align-center", "edt-table-align-right"];
	        }

	        var ui = $.summernote.ui;
	        addStyleString(".scrollable-menu7 {height: auto; max-height: 200px; max-width:300px; overflow-x: hidden;}");
	        context.memo('button.addclasstablealign', function () {
	            return ui.buttonGroup([
	            	//툴바버튼생성
	                ui.button({
	                    className: 'dropdown-toggle7',                        
	                    contents: '<i class="fa fa-align-center"\/>' + ' ' + ui.icon(context.options.icons.caret, 'span'),
	                    container: 'body',
	                    tooltip: '표정렬',	                    
	                    data: {
	                        toggle: 'dropdown'
	                    }
	                }),
	                //드랍다운 목록
	                ui.dropdown({
	                    className: 'dropdown-style scrollable-menu7',
	                    items: context.options.addclasstablealign.classTags,
	                    template: function (item) {
	                    	if (typeof item === 'string') {	                    		
	                            item = {tag: "div", title: item, value: item};
	                        }

	                        var tag = item.tag;
	                        var title = item.title;
	                        var style = item.style ? ' style="' + item.style + '" ' : '';
	                        var cssclass = item.value ? ' class="' + item.value + '" ' : '';
	                        	                        
	                        return '<' + tag + ' ' + style + cssclass + '>' + title + '</' + tag + '>';
	                    },
	                    //클릭이벤트
	                    click: function (event, namespace, value) {
	                    	event.preventDefault();
	                    	
	                    	value = value || $(event.target).closest('[data-value]').data('value');
	                    	if (typeof value==='undefined' || value==="")
	                    		return;
	                    	
	                        var $node = $(context.invoke("restoreTarget"))	                        
	                        if ($node.length==0){
	                            $node = $(document.getSelection().focusNode.parentElement, ".note-editable");
	                        }
	                        
	                        if (typeof context.options.addclasstablealign !== 'undefined' && typeof context.options.addclasstablealign.debug !== 'undefined' && context.options.addclasstablealign.debug) {
	                            console.debug(context.invoke("restoreTarget"), $node, "toggling class: " + value, window.getSelection());
	                        }
	                        	                        
	                        //if ($node[0].nodeName.toLowerCase() !== "p")	                        	
	                        //	return;
	                        	                        
	                        var $table = $(closest(document.getSelection().focusNode.parentElement, 'table table-bordered', 'note-editing-area'));
	                        if ($table !== null) {
	                        	clearClass(context.options.addclasstablealign.classTags, $table);
	                        	$table.toggleClass(value);	                        	
	                        }
	                        	                        
	                        //clearClass(context.options.addclasstablesize.classTags, $node);
	                        //$node.toggleClass(value)	                        
	                    }
	                })
	            ]).render();
	            return $optionList;
	        });
	
	        function addStyleString(str) {
	            var node = document.createElement('style');
	            node.innerHTML = str;
	            document.body.appendChild(node);
	        }
	
	        // This events will be attached when editor is initialized.
	        this.events = {
	            // This will be called after modules are initialized.
	            'summernote.init': function (we, e) {
	                //console.log('summernote initialized', we, e);
	            },
	            // This will be called when user releases a key on editable.
	            'summernote.keyup': function (we, e) {
	                //  console.log('summernote keyup', we, e);
	            }
	        };
	
	        // This method will be called when editor is initialized by $('..').summernote();
	        // You can create elements for plugin
	        this.initialize = function () {
	
	        };
	
	        // This methods will be called when editor is destroyed by $('..').summernote('destroy');
	        // You should remove elements on `initialize`.
	        this.destroy = function () {
	            /*  this.$panel.remove();
	             this.$panel = null; */
	        };
	    },
	    
    });
        
    function closestTag(el, selector, stopSelector) {
	  var retval = null;
	  while (el) {
	    //if (el.className.indexOf(selector) > -1) {
		if ($(el)[0].tagName.toLowerCase() == selector) {
	      retval = el;	      
	      break
	    } else if (stopSelector && el.className.indexOf(stopSelector) > -1) {
	      break
	    }
	    el = el.parentElement;
	  }
	  return retval;
	}

    function closest(el, selector, stopSelector) {
	  var retval = null;
	  while (el) {
	    if (el.className.indexOf(selector) > -1) {
	      retval = el;
	      break
	    } else if (stopSelector && el.className.indexOf(stopSelector) > -1) {
	      break
	    }
	    el = el.parentElement;
	  }
	  return retval;
	}
	
    //동일 스타일 클레스 초기화
    function clearClass(styleClass, node) {
    	$.each(styleClass, function (index, name) {    		
    		if (typeof name == "object") {    			
    			if (node.hasClass(name.value) === true) {    				
    				node.removeClass(name.value);
    			}
    		} else {    			
    			if (node.hasClass(name) === true) {
    				console.log(name);
    				node.removeClass(name);
    			}
    		}    		
    	});    	    	
    }
    
    //아이콘 설정 테스트
    function getIcon(style) {
    	var resultIcon = "";
    	switch(style) {
    		case "l-hr": resultIcon = '<i class="fa fa-minus"\/>'; break;
    		case "m-hr": resultIcon = '<i class="fa fa-minus"\/>'; break;
    		case "s-hr": resultIcon = '<i class="fa fa-minus"\/>'; break;
    	}
    	
    	return resultIcon;
    }
    
}));
