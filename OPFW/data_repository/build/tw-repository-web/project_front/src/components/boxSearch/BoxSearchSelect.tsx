'use strict';

import React, {ReactElement} from 'react';
import BoxSearchContext from "./BoxSearchContext";
import BoxSearchOption from "./BoxSearchOption";
import {BoxSearchOptionProps} from "./BoxSearchTypes";

const BoxSearchSelect = ({title, elementId, dataKey, children}:{title:string, elementId:string, dataKey:string, children: ReactElement<BoxSearchOptionProps> | ReactElement<BoxSearchOptionProps>[]}) => {
    const {searchData, setSearchData, onSearch} = React.useContext(BoxSearchContext);

    const onChange = (event:any) => {
        setSearchData( (prevData:any) => {
            let newData = {...prevData};
            newData[dataKey] = event.target.value===''?undefined:event.target.value;
            return newData;
        });
    }

    const childrenArray = React.Children.toArray(children).filter(
        (child): child is ReactElement<BoxSearchOptionProps> =>
            React.isValidElement(child) && child.type === BoxSearchOption
    );

    return (
        <div className="input-group">
            <span className="input-group-addon">{title}</span>
            <select className="selectpicker" id={elementId} name={elementId} data-toggle="toggle" onChange={onChange}>
                <option value='' hidden selected> {title+'을/를 선택하세요'}</option>
                {childrenArray.map((child, index) => (
                            <option value={child.props.value} key={child.props.value}>{child.props.label}</option>
                        ))}
            </select>
        </div>
    );
}

export default BoxSearchSelect;