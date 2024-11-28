import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

import ImageButton from "@/components/imageButton/ImageButton";
import ButtonView from "@/components/button/ButtonView";
import { MENU_DATA, MENU_DATA_TYPE } from "@/components/MenuData";
import {buttonCategories, buttonLevels} from "../constants";


const PublicHeaderView = (props:any) => {
    const {
        userName,
        currentTopMenuKey,
        showRegistDataButton,
        onClickRequestDataRegistrationBtn,
        onClickMypageBtn,
        onClickLogoutBtn,
        onClickGoIndexBtn,
        onClickTopMenu,
        onClickHeaderRightBtn
    } = props;

    const [tabUnderlineWidth, setTabUnderlineWidth] = useState(0);
    const [tabUnderlineLeft, setTabUnderlineLeft] = useState(0);
    const [hoverUnderlineWidth, setHoverUnderlineWidth] = useState(0);
    const [hoverUnderlineLeft, setHoverUnderlineLeft] = useState(0);
    const [hoverMenu, setHoverMenu] = useState<null | MENU_DATA_TYPE>(null);

    const tabsRef = useRef<any>({});

    useEffect(() => {
        function setTabPosition() {
            const currentTab = currentTopMenuKey?tabsRef.current[currentTopMenuKey]:null;
            setTabUnderlineLeft(currentTab?.offsetLeft ?? 0);
            setTabUnderlineWidth(currentTab?.clientWidth ?? 0);
        }

        setTabPosition();
        window.addEventListener('resize', setTabPosition);

        return () => window.removeEventListener('resize', setTabPosition);
    }, [currentTopMenuKey]);

    useEffect( () => {
        const currentTab = hoverMenu?tabsRef.current[hoverMenu.key]:null;
        setHoverUnderlineLeft(currentTab?.offsetLeft ?? 0);
        setHoverUnderlineWidth(currentTab?.clientWidth ?? 0);
    }, [hoverMenu])

    const renderLogOut = () => {
        return (
            <div className="align-items-center flex flex-row gap-x-4">
                <div className="flex flex-column items-center">
                    <span className="text-nowrap">{userName} 님 </span>
                </div>
                { showRegistDataButton && (
                    <ButtonView
                        level={buttonLevels.secondary}
                        category={buttonCategories.info}
                        onClick={onClickRequestDataRegistrationBtn}
                        text="데이터등록신청"
                    />
                )}
                <ButtonView
                    level={buttonLevels.secondary}
                    category={buttonCategories.info}
                    onClick={onClickMypageBtn}
                    text="마이페이지"
                />
                <ButtonView
                    level={buttonLevels.secondary}
                    category={buttonCategories.info}
                    onClick={onClickLogoutBtn}
                    text="Logout"
                />
            </div>
        );
    };
    
    return (
        <div className="sticky top-0 z-10 bg-white">
            <div
                className={`flex h-20 w-full items-center justify-center border-b border-gray-200 px-12`}
            >
                <div className="flex-1">
                    <div className="pt-3">
                        <ImageButton
                            imageSrc={require(`@images/twin_repository.png`)}
                            onClick={onClickGoIndexBtn}/>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="align-items-center flex flex-row justify-around gap-x-4 pt-2">
                        <button
                            className={[
                                `min-h-9 min-w-20 cursor-pointer bg-white outline-none font-bold font-nanumSquareR text-lg19 text-nowrap`,
                            ].join(" ")}
                            key={MENU_DATA.FIND_DATA.key}
                            ref={(el: any) => (tabsRef.current[MENU_DATA.FIND_DATA.key] = el)}
                            onClick={() => onClickTopMenu(MENU_DATA.FIND_DATA)}
                            onMouseEnter={() => setHoverMenu(MENU_DATA.FIND_DATA)}
                            onMouseLeave={() => setHoverMenu(null)}
                        >
                            데이터찾기
                        </button>
                        <button
                            className={[
                                `min-h-9 min-w-20 cursor-pointer bg-white outline-none font-bold font-nanumSquareR text-lg19 text-nowrap`,
                            ].join(" ")}
                            key={MENU_DATA.USER_GUIDE.key}
                            ref={(el: any) => (tabsRef.current[MENU_DATA.USER_GUIDE.key] = el)}
                            onClick={() => onClickTopMenu(MENU_DATA.USER_GUIDE)}
                            onMouseEnter={() => setHoverMenu(MENU_DATA.USER_GUIDE)}
                            onMouseLeave={() => setHoverMenu(null)}
                        >
                            이용안내
                        </button>
                    </div>
                    <span
                        className="bg-primary-400 absolute bottom-0 block h-1.5"
                        style={{ left: hoverUnderlineLeft, width: hoverUnderlineWidth }}
                    />
                    <span
                        className="bg-primary-700 absolute bottom-0 block h-1.5"
                        style={{ left: tabUnderlineLeft, width: tabUnderlineWidth }}
                    />
                </div>
                <div className="flex flex-1 flex-row-reverse">
                    <div className="pt-2">
                        {userName ? (
                            renderLogOut()
                        ) : (
                            <ButtonView
                                level={buttonLevels.secondary}
                                category={buttonCategories.info}
                                onClick={onClickHeaderRightBtn}
                                text="Login"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

PublicHeaderView.propTypes = {
    userName: PropTypes.string,
    currentTopMenuKey: PropTypes.oneOf([
        MENU_DATA.FIND_DATA.key,
        MENU_DATA.USER_GUIDE.key
    ]),
    showRegistDataButton: PropTypes.bool,

    onClickRequestDataRegistrationBtn: PropTypes.func,
    onClickMypageBtn: PropTypes.func,
    onClickLogoutBtn: PropTypes.func,
    onClickGoIndexBtn: PropTypes.func,
    onClickTopMenu: PropTypes.func,
    onClickHeaderRightBtn: PropTypes.func,
};

PublicHeaderView.defaultProps = {
    userName: null,
    currentTopMenuKey: null,
    showRegistDataButton: false
};

export default PublicHeaderView;