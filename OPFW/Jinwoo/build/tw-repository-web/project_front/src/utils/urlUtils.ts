const getUrlEndPath = () => {
    const regex = /(?<=\/)([\w|-]+)(?=\.\w+(\?.*)*$)/;

    let menuStringFromPath = window.location.pathname.match(regex);
    return menuStringFromPath===null?null:menuStringFromPath[0];
}

const getUrlParam = (key:string) => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(key);
};

export { getUrlEndPath, getUrlParam };