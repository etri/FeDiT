(function() {
    'use strict'
    $(document).ready(function() {
        $(document).on('click', '.file-upload-browse', function(e) {
            var file = $(this).closest('div.attach-file').find('input.file-upload-default');
            file.trigger('click');
        });
        $(document).on('change', '.file-upload-default', function(e) {
            $(this).parent().find('input.file-upload-title').val($(this).val().replace(/C:\\fakepath\\/i, ''));
        });
    });
})();