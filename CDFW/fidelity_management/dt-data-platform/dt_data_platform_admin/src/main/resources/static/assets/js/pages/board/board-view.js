document.addEventListener('DOMContentLoaded', function () {
    let fileElement = document.querySelector('.custom-file');
    if (fileElement && fileElement.querySelector('a')) {
        console.log('fileElement', fileElement);
    }
});