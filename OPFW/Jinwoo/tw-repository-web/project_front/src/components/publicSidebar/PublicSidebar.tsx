"use strict";

import React, { useState } from "react";
import { myPageMenuData } from "@/components/MenuData";
import { getUrlParam } from "@/utils/urlUtils";

const ChildTree = ({
  node,
  width,
  selectedChildKey,
}: {
  node: any;
  width: string;
  selectedChildKey?: string | null;
}) => {
  if (node === null) {
    return null;
  }
  const [selectedChildItem, setSelectedChildItem] = useState<number | null>(
    null,
  );

  return (
    <div className="flex flex-col justify-start gap-y-2.5 rounded-lg bg-grayscale-50 p-3">
      {node.map((item: any, index: number) => {
        return (
          <div
            className="relative flex list-none flex-col items-start"
            key={index}
            // onClick={() => setSelectedChildItem(index)}
          >
            <div
              className={
                "cursor-pointer p-2 py-1 text-center hover:border-primary-500 hover:text-primary-500" +
                " " +
                (selectedChildKey === item.data.key
                  ? "text-primary-700"
                  : "text-black")
              }
            >
              <div
                className="font-nanumSquareR overflow-hidden text-ellipsis whitespace-nowrap text-lg font-medium"
                onClick={() => {
                  window.location.href = item.data.path;
                }}
              >
                {item.data.name}
              </div>
            </div>
            {/*{selectedChildItem === index && (*/}
            {/*  <ChildTree node={item.children} width={"85%"} />*/}
            {/*)}*/}
          </div>
        );
      })}
    </div>
  );
};

const PublicSidebar = ({ index } : {index:number}) => {
  const [sideMenuList, setSideMenuList] = useState(() =>
    myPageMenuData.findAllTopMenu(),
  );
  const [selectedItem, setSelectedItem] = useState<number | null>(index);
  const [selectedChildKey, setSelectedChildKey] = React.useState<string | null>(
    getUrlParam("mypagekey"),
  );

  return (
    <div id="public-sidebar" className="w-sidebar flex flex-col bg-white">
      <div className="relative flex flex-col overflow-hidden shadow-inner">
        <div>
          <div className="flex flex-col gap-2.5 rounded-xl border border-grayscale-200 p-6">
            {sideMenuList.map((item: any, index: number) => {
              return (
                <div
                  className="relative list-none"
                  key={index}
                  onClick={() => setSelectedItem(index)}
                >
                  <div
                    className={
                      "cursor-pointer border-solid border-grayscale-100 bg-white py-4 uppercase leading-5 hover:text-primary-600 " +
                      (index === selectedItem ? "border-transparent" : "" +
                      (index === sideMenuList.length - 1 ? "" : "border-b"))
                    }
                  >
                    <div
                      className={
                        "after:content-iconArrow font-nanumSquareR text-lg19 m-auto flex overflow-hidden overflow-ellipsis whitespace-nowrap font-bold after:absolute after:right-0 " +
                        (index === selectedItem
                          ? "text-primary-700 after:rotate-180"
                          : "")
                      }
                    >
                      {item.data.name}
                    </div>
                  </div>
                  {selectedItem === index && (
                    <ChildTree
                      node={item.children}
                      selectedChildKey={selectedChildKey}
                      width={"90%"}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSidebar;
