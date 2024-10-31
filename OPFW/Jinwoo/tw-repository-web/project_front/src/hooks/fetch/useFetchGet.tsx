'use strict';

import { useEffect, useState } from "react";
import { fetchGet } from "@/utils/fetchUtil";

type props = {
  url:string;
  param?: any;
}

const useFetchGet = ({url, param}: props) => {

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    let option: any = {};

    if (param && param.param !== null) {
      option.body = param.param;
    }

    option.successCallback = (responseJson:any) => {
      setData(responseJson);
      if(param && param.successCallback){
        param.successCallback(responseJson);
      }
    }

    option.failCallback = (responseMessage:string) => {
      setError(responseMessage);
      if(param && param.failCallback){
        param.failCallback(responseMessage);
      }
    }

    fetchGet(url, option)
      .finally(()=>setLoading(false));
  }, [url]);

  return { data, loading, error };
};

useFetchGet.defaultProps = {};

export default useFetchGet;