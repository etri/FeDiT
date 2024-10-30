'use strict';

import React, {useState} from "react";
import {ScrollMenu, VisibilityContext, publicApiType} from "react-horizontal-scrolling-menu";
import DataItemCategoryCard from "./DataItemCategoryCard";
import "react-horizontal-scrolling-menu/dist/styles.css";
import {DragDealer} from "./DragDealer";
import {MENU_DATA} from "../MenuData";
import styled from "styled-components";

const NoScrollbar = styled('div')({
    '& .react-horizontal-scrolling-menu--scroll-container::-webkit-scrollbar': {
        display: 'none',
    },
    '& .react-horizontal-scrolling-menu--scroll-container': {
        scrollbarWidth: 'none',
        '-ms-overflow-style': 'none',
    },
});

type scrollVisibilityApiType = React.ContextType<typeof VisibilityContext>;

const DataItemCategories = ({}) => {
    const [categories, setCategories] = useState<any[]|null>(null);
    const [selected, setSelected] = useState<string>("");
    const dragState = React.useRef(new DragDealer());

    const fetchData = async () => {
        fetch("/public/data-category-desc/get.json",  {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        }).then(rest => rest.json())
            .then( (res) => {
                let newArr = res.data;
                if(null!==newArr) {
                    newArr.push({"category":"add", "iconSaveFileName":"add.png"});
                }
                setCategories(newArr);
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
        let selectedItem = categories?.find( (item) => item.category === itemId);
        if(!selectedItem.hasOwnProperty("name"))
            return;

        window.location.href = `/${MENU_DATA.FIND_DATA.path}?category=${selectedItem.category}`;
        setSelected(selected !== itemId ? itemId : "");
    };

    return (
        <div className="flex flex-row justify-center">
            <div className="overflow-hidden w-[1000px]">
                {categories&&
                    <NoScrollbar onMouseLeave={dragState.current.dragStop}>
                        <ScrollMenu
                            LeftArrow={LeftArrow}
                            RightArrow={RightArrow}
                            onWheel={onWheel}
                            onMouseDown={() => dragState.current.dragStart}
                            onMouseUp={() => dragState.current.dragStop}
                            onMouseMove={handleDrag}>
                            {categories.map((item) => (
                                <DataItemCategoryCard
                                    itemId={item.category} // NOTE: itemId is required for track items
                                    title={item.name}
                                    desc={item.description}
                                    key={item.category}
                                    icon={item.iconSaveFileName}
                                    onClick={handleItemClick(item.category)}
                                    selected={item.category === selected}
                                />
                            ))}
                        </ScrollMenu>
                    </NoScrollbar>
                }
            </div>
        </div>
    );
}

export default DataItemCategories;

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
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                right: "1%",
                opacity: disabled ? "0.1" : "1",
                userSelect: "none",
            }}
        >
            {children}
        </button>
    );
}
