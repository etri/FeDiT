"use strict";

import { useMemo } from "react";
import useFetchGet from "@/hooks/fetch/useFetchGet";

const useFetchCodeValues = (codeId: string) : {codeValues:any[]|null, loading:boolean, error:string|null } => {
  const { data, loading, error } = useFetchGet( { url : `/public/code/list.json?codeId=${codeId}`});

  const codeValues : any[]|null = useMemo(() => {
    if (data) {
      return data;
    }
    return null;
  }, [data]);

  return { codeValues, loading, error };
};

useFetchCodeValues.defaultProps = {};

export default useFetchCodeValues;