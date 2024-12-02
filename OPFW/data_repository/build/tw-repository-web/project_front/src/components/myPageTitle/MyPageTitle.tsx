import React, {useMemo, useState} from 'react';
import PropTypes from 'prop-types';
import {getUrlParam} from "@/utils/urlUtils";
import {myPageMenuData} from "@/components/MenuData";
import MyPageTitleView from "./MyPageTitleView";

const MyPageTitle = (props: any) => {
    const {} = props;

    const [parentMenuTitle,setParentMenuTitle] = useState<string|null>(null);
    const [childMenuTitle,setChildMenuTitle] = useState<string|null>(null);

    useMemo( ()=> {
        let currentMenuKey = getUrlParam("mypagekey");
        let menuStack = myPageMenuData.findMenuStack(currentMenuKey);
        setParentMenuTitle(menuStack[0].data.name);
        setChildMenuTitle(menuStack[1].data.name);
    }, []);

    return (
        <MyPageTitleView parentTitle={parentMenuTitle} childTitle={childMenuTitle}/>
    );
};

MyPageTitle.propTypes = {

};

MyPageTitle.defaultProps = {};

export default MyPageTitle;