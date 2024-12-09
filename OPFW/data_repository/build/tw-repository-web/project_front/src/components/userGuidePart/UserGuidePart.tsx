'use strict';

import React from "react";
import {publicApiType, ScrollMenu, VisibilityContext} from "react-horizontal-scrolling-menu";
import "react-horizontal-scrolling-menu/dist/styles.css";
import {DragDealer} from "../dataItemCategories/DragDealer";
import {MENU_DATA} from "../MenuData";
import UserGuidePartCard from "./UserGuidePartCard";
import styled from "styled-components";
import "@scss/base.scss"
import "./UserGuidePartStyle"

const NoScrollbar = styled('div')({
    '& .react-horizontal-scrolling-menu--scroll-container::-webkit-scrollbar': {
        display: 'none',
    },
    '& .react-horizontal-scrolling-menu--scroll-container': {
        scrollbarWidth: 'none',
        '-ms-overflow-style': 'none',
    },
});

const UserGuidePart = ({}:{}) => {
    const [categories, setCategories] = React.useState(
        [
            {
                name: "홈에서검색",
                id: "0"
            },
            {
                name: "검색 결과 확인",
                id: "1"
            },
            {
                name: "데이터 정보 확인",
                id: "2"
            }]
    );
    const [selected, setSelected] = React.useState<string>("0");
    const dragState = React.useRef(new DragDealer());

    React.useEffect(() => {
    }, []);

    const handleDrag =
        ({ scrollContainer }: scrollVisibilityApiType) =>
            (ev: React.MouseEvent) =>
                dragState.current.dragMove(ev, (posDiff: number) => {
                    if (scrollContainer.current) {
                        scrollContainer.current.scrollLeft += posDiff;
                    }
                });

    const handleItemClick = (itemId: string) => () => {
        if (dragState.current.dragging) {
            return false;
        }

        setSelected(selected !== itemId ? itemId : "");
    };

    return (
        <div>
            <div className="flex flex-row justify-center mt-12" onMouseLeave={dragState.current.dragStop}>
                <div className="overflow-hidden w-[630px]">
                    {categories&&
                        <NoScrollbar onMouseLeave={dragState.current.dragStop}>
                            <ScrollMenu
                                LeftArrow={null}
                                RightArrow={null}
                                onWheel={onWheel}
                                onMouseDown={() => dragState.current.dragStart}
                                onMouseUp={() => dragState.current.dragStop}
                                onMouseMove={handleDrag}>
                                    {categories.map((item:any) => {
                                            return (
                                                <UserGuidePartCard
                                                    itemId={item.id} // NOTE: itemId is required for track items
                                                    title={item.name}
                                                    key={item.id}
                                                    onClick={handleItemClick(item.id)}
                                                    selected={item.id === selected}
                                                />)
                                        }
                                    )}
                        </ScrollMenu>
                        </NoScrollbar>
                    }
                </div>
            </div>
            <div className="flex flex-col content-center flex-wrap mt-10">
                {selected=="0"&&<img src={require(`@images/userguide_0.png`)}/>}
                {selected=="1"&&<img src={require(`@images/userguide_1.png`)}/>}
                {selected=="2"&&
                    <>
                        <img src={require(`@images/userguide_2_1.png`)}/>
                        <img src={require(`@images/userguide_2_2.png`)}/>
                        <img src={require(`@images/userguide_2_3.png`)}/>
                    </>
                }
            </div>
        </div>
    );
}

export default UserGuidePart;

function onWheel(apiObj: scrollVisibilityApiType, ev: React.WheelEvent): void {
    const isThouchpad = Math.abs(ev.deltaX) !== 0 || Math.abs(ev.deltaY) < 15;

    if (isThouchpad) {
        ev.stopPropagation();
        return;
    }

    if (ev.deltaY < 0) {
        apiObj.scrollNext();
    } else if (ev.deltaY > 0) {
        apiObj.scrollPrev();
    }
}

function LeftArrow() {
    const visibility = React.useContext<publicApiType>(VisibilityContext);
    const isFirstItemVisible = visibility.useIsVisible("first", true);

    return (
        <Arrow disabled={isFirstItemVisible} onClick={() => visibility.scrollPrev()}>
            <img
                src={require(`../../../assets/images/chevron_left.png`)}
                alt=""
            />
        </Arrow>
    );
}

function RightArrow() {
    const visibility = React.useContext<publicApiType>(VisibilityContext);
    const isLastItemVisible = visibility.useIsVisible("last", false);

    return (
        <Arrow disabled={isLastItemVisible} onClick={() => visibility.scrollNext()}>
            <img src={require(`../../../assets/images/chevron_right.png`)} alt=""/>
        </Arrow>
    );
}

function Arrow({
                   children,
                   disabled,
                   onClick,
               }: {
    children: React.ReactNode;
    disabled: boolean;
    onClick: VoidFunction;
}) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            style={{
                cursor: disabled?"not-allowed":"pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                right: "1%",
                opacity: disabled ? "0.1" : "1",
                userSelect: "none",
                width: "50px",
                height: "50px"
            }}
        >
            {children}
        </button>
    );
}