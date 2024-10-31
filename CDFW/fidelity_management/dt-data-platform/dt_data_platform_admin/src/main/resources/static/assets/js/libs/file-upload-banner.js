(function() {
    'use strict'
    $(document).ready(function() {
        $(document).on('click', '.file-upload-browse-pc', function(e) {
            var file = $(this).closest('div.attach-file-pc').find('input.file-upload-default-pc');
            file.trigger('click');
        });
        $(document).on('change', '.file-upload-default-pc', function(e) {
            $(this).parent().find('input.file-upload-title-pc').val($(this).val().replace(/C:\\fakepath\\/i, ''));
        });
        
        /*
        $(document).on('click', '.file-upload-browse-mobile', function(e) {
            var file = $(this).closest('div.attach-file-mobile').find('input.file-upload-default-mobile');
            file.trigger('click');
        });
        $(document).on('change', '.file-upload-default-mobile', function(e) {
            $(this).parent().find('input.file-upload-title-mobile').val($(this).val().replace(/C:\\fakepath\\/i, ''));
        });
        */
        
    });
})();