'use strict';

import React, {useCallback} from "react";
import { showRegistDataButton } from "@/utils/userUtil";
import ButtonView from "./ButtonView";
import {buttonCategories, buttonLevels} from "@/components/constants";

const ButtonDataUseRequest = ({dataId, disabled}:{dataId:number, disabled:boolean}) => {

    const onclick = useCallback(() => {
        window.location.href = `/public/user/dataUseRequest.mng?id=${dataId}`;
    },[]);

    const renderButton = () => {
        if(showRegistDataButton()) {
            return <ButtonView level={buttonLevels.primary}
                               category={buttonCategories.info}
                               onClick={onclick}
                               isDisabled={disabled}
                               text={disabled?"신청완료":"사용신청"}/>;
        } else {
            return <div/>
        }
    }

    return (
        <>
            { renderButton()}
        </>
    )
}

export default ButtonDataUseRequest;