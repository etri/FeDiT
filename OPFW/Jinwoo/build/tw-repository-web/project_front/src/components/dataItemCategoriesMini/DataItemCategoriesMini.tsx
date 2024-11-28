'use strict';

import React from "react";
import {publicApiType, ScrollMenu, VisibilityContext} from "react-horizontal-scrolling-menu";
import "react-horizontal-scrolling-menu/dist/styles.css";
import {DragDealer} from "../dataItemCategories/DragDealer";
import {MENU_DATA} from "../MenuData";
import DataItemCategoriesMiniCard from "./DataItemCategoriesMiniCard";
import styled from "styled-components";
import "@scss/base.scss"
import "./DataItemCategoriesMiniStyle"

const NoScrollbar = styled('div')({
    '& .react-horizontal-scrolling-menu--scroll-container::-webkit-scrollbar': {
        display: 'none',
    },
    '& .react-horizontal-scrolling-menu--scroll-container': {
        scrollbarWidth: 'none',
        '-ms-overflow-style': 'none',
    },
});

const DataItemCategoriesMini = ({category}:{category:string}) => {
    const [categories, setCategories] = React.useState(null);
    const [selected, setSelected] = React.useState<string>("");
    const dragState = React.useRef(new DragDealer());

    const fetchData = async () => {
        fetch("/public/data-category-desc/get.json",  {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        }).then(rest => rest.json())
            .then( (res) => {
                if(res.data){
                    res.data.unshift({name:'전체', category:''});
                }
                res.data.forEach((item, index) => {item.id = index.toString()});
                setCategories(res.data);

                let found = res.data.find( item => item.category === category);
                if(found){
                    setSelected(found.id);
                }else{
                    setSelected("0");
                }
            });
    }

    React.useEffect(() => {
        fetchData();
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
        let selectedItem = categories?.find( (item) => item.id === itemId);
        let categoryQuery = '';
        if(selectedItem.id!=='0'){
            categoryQuery = `category=${selectedItem.category}`;
        }
        window.location.href = `/${MENU_DATA.FIND_DATA.path}?${categoryQuery}`;
        setSelected(selected !== itemId ? itemId : "");
    };

    return (
        <div className="flex flex-row justify-center mt-12" onMouseLeave={dragState.current.dragStop}>
            <div className="overflow-hidden w-[870px]">
                {categories&&
                    <NoScrollbar onMouseLeave={dragState.current.dragStop}>
                        <ScrollMenu
                            LeftArrow={LeftArrow}
                            RightArrow={RightArrow}
                            onWheel={onWheel}
                            onMouseDown={() => dragState.current.dragStart}
                            onMouseUp={() => dragState.current.dragStop}
                            onMouseMove={handleDrag}>
                            {categories.map((item:any) => {
                                    return (<DataItemCategoriesMiniCard
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
    );
}

export default DataItemCategoriesMini;

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