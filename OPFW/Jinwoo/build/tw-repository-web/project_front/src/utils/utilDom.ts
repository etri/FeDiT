function getAbsoluteTopWithoutScroll(element:Element | null) {
    let top = 0;
    while (element) {
        top += element.offsetTop;
        element = element.offsetParent;
    }
    return top;
}

export { getAbsoluteTopWithoutScroll }