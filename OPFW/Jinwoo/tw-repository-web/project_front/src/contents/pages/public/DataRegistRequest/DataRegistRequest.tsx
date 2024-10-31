"use strict";

import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { useForm, useWatch } from "react-hook-form";
import PublicHeader from "@/components/publicHeader/PublicHeader";
import PublicFooter from "@/components/publicFooter/PublicFooter";
import { PublicMain } from "@/components/PublicMain";
import { PublicContainer } from "@/components/PublicContainer";
import ReactHookFormOptions from "@/components/reactHookForm/ReactHookFormOptions";
import ReactHookFormInput from "@/components/reactHookForm/ReactHookFormInput";
import ReactHookFormRadio from "@/components/reactHookForm/ReactHookFormRadio";
import TabItem from "@/components/tab/TabItem";
import TabList from "@/components/tab/TabList";
import ReactHookFormTextarea from "@/components/reactHookForm/ReactHookFormTextarea";

import "./DataRegistRequestStyle";
import ReactHookFormSelect from "@/components/reactHookForm/ReactHookFormSelect";
import ReactHookFormOption from "@/components/reactHookForm/ReactHookFormOption";
import { fetchJson } from "@/utils/fetchUtil";
import { customAlert } from "@/utils/dialogUtil";

const DataRegistRequest = ({}) => {
    const defaultValues = {
        apiType: {value:"REST", label:"REST"},
        dataFormat: {value:"JSON", label:"JSON"},
    }

    const form = useForm({
        mode: 'onBlur',
        defaultValues: defaultValues
    });
    const {
        register,
        handleSubmit,
        setError,
        setValue,
        reset,
        control,
        formState: { errors }
    } = form;
    const watchedDataType = useWatch({ control, name : "type"});

    useEffect( ()=> {
        reset({...defaultValues})
    }, []);

    const onSubmit = async (data:any) => {
        data.category = data.category.value;
        data.apiType = data.apiType.value;
        data.dataFormat = data.dataFormat.value;
        // console.log(data);

        fetchJson("POST", "/public/data-item-regist-request.json", {
            data: data,
            successCallback : (responseJson:any) => {
                customAlert("데이터등록 신청되었습니다.");
                location.href="/index.mng";
            }
        });
    }

    const onClickTab = (index:number) => {
        if(index===0){
            setValue("restIp", null);
            setValue("restPort", null);
            setValue("swaggerUrl", null);
        }else{
            setValue("externalUrl", null);
        }
    }

    return (
        <PublicContainer>
            <PublicHeader/>
            <PublicMain>
                <div className="top-container">
                    <div className="container">
                        <div className="member-container">
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <div className="header">
                                    <div>데이터 등록 신청</div>
                                </div>
                                <div>
                                    <div className="input-container">
                                        <ReactHookFormSelect name="category" label="데이터 분류" reactHookFormOption={ReactHookFormOptions.Required("데이터분류")}
                                                             errors={errors} control={control}>
                                            <ReactHookFormOption label={"교통"} value={"traffic"}/>
                                            <ReactHookFormOption label={"환경"} value={"environment"}/>
                                            <ReactHookFormOption label={"관광"} value={"tourism"}/>
                                        </ReactHookFormSelect>
                                        <div className="radio-container">
                                            <ReactHookFormRadio name="type"
                                                                className="react-hook-form-input data-type"
                                                                label="수집데이터"
                                                                value="RAWDATA"
                                                                reactHookFormOption={ReactHookFormOptions.Required("데이터타입")}
                                                                errors={errors}
                                                                register={register}/>
                                            <ReactHookFormRadio name="type"
                                                                className="react-hook-form-input data-type"
                                                                label="트윈데이터"
                                                                value="TWIN"
                                                                reactHookFormOption={ReactHookFormOptions.Required("데이터타입")}
                                                                errors={errors}
                                                                register={register}/>
                                        </div>
                                        <div className="error-message">{errors["type"]?.message}</div>
                                        {/*{watchedDataType==="RAWDATA"&&*/}
                                        {/*    <ReactHookFormInput name="dataCode"*/}
                                        {/*                        className="react-hook-form-input data-code"*/}
                                        {/*                        label="데이터코드"*/}
                                        {/*                        reactHookFormOption={ReactHookFormOptions.DataCode}*/}
                                        {/*                        errors={errors}*/}
                                        {/*                        register={register}/>*/}
                                        {/*}*/}
                                        <TabList activeTabIndex={0} tabClickCallback={onClickTab}>
                                            <TabItem label="외부">
                                                <ReactHookFormInput name="externalUrl"
                                                                    className="react-hook-form-input external-url"
                                                                    label="외부URL"
                                                                    reactHookFormOption={ReactHookFormOptions.ExternalUrl}
                                                                    errors={errors}
                                                                    register={register}/>
                                            </TabItem>
                                            <TabItem label="내부">
                                                <ReactHookFormInput name="restIp"
                                                                    className="react-hook-form-input rest-ip"
                                                                    label="REST IP"
                                                                    reactHookFormOption={ReactHookFormOptions.RestIp}
                                                                    errors={errors}
                                                                    register={register}/>
                                                <ReactHookFormInput name="restPort"
                                                                    className="react-hook-form-input rest-port"
                                                                    label="REST PORT"
                                                                    reactHookFormOption={ReactHookFormOptions.RestPort}
                                                                    errors={errors}
                                                                    register={register}/>
                                                <ReactHookFormInput name="swaggerUrl"
                                                                    className="react-hook-form-input swagger-url"
                                                                    hidden={false}
                                                                    label="API 문서 URL"
                                                                    reactHookFormOption={ReactHookFormOptions.SwaggerUrl}
                                                                    errors={errors}
                                                                    register={register}/>
                                            </TabItem>
                                        </TabList>
                                        <ReactHookFormInput name="name"
                                                            className="react-hook-form-input data-name"
                                                            label="데이터명"
                                                            reactHookFormOption={ReactHookFormOptions.DataName}
                                                            errors={errors}
                                                            register={register}/>
                                        <ReactHookFormInput name="serviceId"
                                                            className="react-hook-form-input service-id"
                                                            label="서비스아이디"
                                                            reactHookFormOption={ReactHookFormOptions.ServiceId}
                                                            errors={errors}
                                                            register={register}/>
                                        <ReactHookFormInput name="swaggerHomepath"
                                                            className="react-hook-form-input swagger-home-path"
                                                            label="API 문서 HomePath"
                                                            reactHookFormOption={ReactHookFormOptions.SwaggerHomepath}
                                                            errors={errors}
                                                            register={register}/>
                                        <ReactHookFormInput name="swaggerTagList"
                                                            className="react-hook-form-input swagger-tag-list"
                                                            label="API 문서 Tag List"
                                                            reactHookFormOption={ReactHookFormOptions.SwaggerTagList}
                                                            errors={errors}
                                                            register={register}/>
                                        <ReactHookFormSelect name="apiType" label="데이터 API 타입" defaultValue={"REST"} reactHookFormOption={ReactHookFormOptions.Required("데이터 API 타입")}
                                                             errors={errors} control={control}>
                                            <ReactHookFormOption label={"REST"} value={"REST"}/>
                                        </ReactHookFormSelect>
                                        <ReactHookFormSelect name="dataFormat" label="데이터 포맷" defaultValue={"JSON"} reactHookFormOption={ReactHookFormOptions.Required("데이터 포맷")}
                                                             errors={errors} control={control}>
                                            <ReactHookFormOption label={"JSON"} value={"JSON"}/>
                                        </ReactHookFormSelect>
                                        <ReactHookFormTextarea name="description"
                                                               className="react-hook-form-input desc"
                                                               label="설명"
                                                               reactHookFormOption={ReactHookFormOptions.DataDesc}
                                                               form={form}/>
                                    </div>
                                </div>
                                <div style={{display:"flex", flexDirection:"row", justifyContent:"center"}}>
                                    <button className="btn" type="submit">등록</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </PublicMain>
            <PublicFooter/>
        </PublicContainer>
    );
}

let domContainer = document.querySelector('#contentContainer');
ReactDOM.render(<DataRegistRequest/>, domContainer);