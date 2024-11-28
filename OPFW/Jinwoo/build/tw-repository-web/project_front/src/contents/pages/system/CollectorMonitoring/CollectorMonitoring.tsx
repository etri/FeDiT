'use strict';

import React, {useState} from "react";
import ReactDOM from 'react-dom';

import Global from "@/modules/Global";
import MenuInfoTag from "@/components/MenuInfoTag";
import SearchBar from "@/components/SearchBar";
import CollectorMonitoringList from "./CollectorMonitoringList";
import useDebounce from "@/hooks/useDebounce";

function CollectorMonitoring() {
    const [loading, setLoading] = React.useState<boolean>(true);
    const [searchTxt, setSearchTxt] = useState('');
    const [isPending, debouncedValue] = useDebounce(searchTxt, 300);
    const [dataInitial, setDataInitial] = React.useState<any>(null);
    const [searchData, setSearchData] = React.useState<{}|null>({});

    const fetchInitial = () => {
        let params = new URLSearchParams();
        let options = Global.getFetchOption(params);

        fetch("/system/collector/initial.json", options)
            .then(res => res.json())
            .then(
                (res) => {
                    if( res.result === "success" ) {
                        setDataInitial(res.data);
                        setLoading(false);
                    } else {
                        alert(res.message);
                    }
                }
            );
    }

    React.useEffect( () => {
        fetchInitial();
    }, []);

    return (
        <React.Fragment>
            <section className="content-header">
                <MenuInfoTag/>
            </section>
            <section className="content">
                <div className="row">
                    <div className="col-xs-12">
                        <div className="box box-primary">
                            <div className="box-body">
                                {loading ? null :
                                    <>
                                        <SearchBar searchTxt={searchTxt} placeholder={"Search allocators (eg.대기오염정보)"} setSearchTxt={setSearchTxt} height={'70px'} />
                                        <CollectorMonitoringList searchValue={debouncedValue} />
                                    </>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </React.Fragment>
    );
}

let domContainer = document.querySelector('#contentContainer');
ReactDOM.render(<CollectorMonitoring />, domContainer);