(function($) {

    // We should take in an argument for endDrag
    $.fn.SplitterBar = function () {
        $(this).css('display', 'flex');

        let leftSide = $(this).children('.left').first();
        let rightSide = $(this).children('.right').first();

        leftSide.css('background-color', '#FFFFFF');
        leftSide.css('width', '30%');
        leftSide.css('height', '100%');
        leftSide.css('borderTop', 'solid');
        leftSide.css('borderRight', 'solid');
        leftSide.css('borderBottom', 'solid');
        leftSide.css('borderWidth', '1px');
        leftSide.css('borderColor', '#CCCCCC');
        leftSide.css('textAlign', 'left');

        rightSide.css('background-color', '#FFFFFF');
        rightSide.css('flex', '1');
        rightSide.css('height', '100%');
        rightSide.css('borderTop', 'solid');
        rightSide.css('borderLeft', 'solid');
        leftSide.css('borderBottom', 'solid');
        rightSide.css('borderWidth', '1px');
        rightSide.css('borderColor', '#CCCCCC');
        rightSide.css('textAlign', 'left');

        // Inject splitter bar
        let splitterBar = $(document.createElement('div'));
        splitterBar.css('background-color', '#EFEFEF');
        splitterBar.css('width', '10px');
        //splitterBar.css('borderLeft', 'solid');
        //splitterBar.css('borderRight', 'solid');
        //splitterBar.css('borderWidth', '1px');
        //splitterBar.css('borderColor', '#CCCCCC');

        leftSide.after(splitterBar);

        let isDragging = false;

        splitterBar.mousedown((event) => {
            isDragging = true;
            return false;
        });

        splitterBar.mouseup((event) => {
            isDragging = false;
            return false;
        });

        $(this).mousemove((event) => {
            if (isDragging) {
                let leftOfLeft = leftSide.position().left;
                var width = event.pageX - leftOfLeft - splitterBar.width() / 2;
                leftSide.width(event.pageX - leftOfLeft - splitterBar.width() / 2);
                console.log(width);
            }
        });

        splitterBar.on('touchstart', function (event) {
            isDragging = true;
            return false;
        });
        splitterBar.on('touchend', function (event) {
            isDragging = false;
            return false;
        });
        $(this).on('touchmove', function (event) {
            event.preventDefault();
            var e = event.originalEvent;
            moveTouchX = e.targetTouches[0].pageX;
            moveTouchY = e.targetTouches[0].pageY;
            if (isDragging) {
                let leftOfLeft = leftSide.position().left;
                leftSide.width(moveTouchX - leftOfLeft - splitterBar.width() / 2);
            }
        });
    };
}(jQuery));