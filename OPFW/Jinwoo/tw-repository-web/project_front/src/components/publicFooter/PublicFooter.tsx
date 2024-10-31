import React from "react";
import {
    Box,
    Logo,
    DescWrapper, FooterContainer
} from "./PublicFooterStyle";

const PublicFooter = () => {
    return (
        <div id="public-footer" className="min-h-[200px] justify-center flex flex-col z-10 px-9 bg-black bottom-0 text-white w-full">
            <FooterContainer>
                <Logo src={require(`@images/logo_footer.png`)}/>
                <DescWrapper>
                    <span>㈜진우소프트이노베이션 대표 : 이무용 사업자등록번호 : 616-81-29946</span>
                    <span>제주특별자치도 제주시 첨단로 8길 40, 309 310호(아라일동)</span>
                    <span>TEL : 064.742.1816, FAX : 064.742.1817</span>
                    <span>Copyright 2000. JINWOO Soft Innovation All Rights reserved.</span>
                </DescWrapper>
            </FooterContainer>
        </div>
    )
}

export default PublicFooter;