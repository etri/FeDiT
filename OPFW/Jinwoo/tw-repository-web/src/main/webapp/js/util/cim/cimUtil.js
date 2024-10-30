var cimTime = (function () {
    return {
        isSameDay: function(d1, d2) {
            return d1.getFullYear() === d2.getFullYear() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getDate() === d2.getDate();
        },
        parseStringToHHMM: function (str) {
            if(strUtil.isEmpty(str))
                return "";
            let t_str = str.substr(0,2);
            let m_str = str.substr(2,2);
            return t_str + ":" + m_str;
        },
        parseHHMMToString: function (time) {
            if(strUtil.isEmpty(time))
                return "";
            return time.replace(":","");
        },
        makeDateFromDateAndTime: function (date, time) {
            if(strUtil.isEmpty(date) || strUtil.isEmpty(time))
                return null;
            return new Date(date + " " + time).format("yyyy-MM-ddTHH:mm:ss");
            //return new Date(date + " " + time);
            //return new Date(date + " " + time).format("yyyy-MM-dd HH:mm:ss");
        }
    }
}());

var chargerChannelType = (function () {
    return {
        getBitfieldFromAcList: function (list) {
            let bitfield = 0;
            list.forEach(function(item, index, arr){
                switch (item.chnlTp)
                {
                    case 'AC_TYPE1':
                        bitfield |= 0b00000001;
                        break;
                    case 'AC_TYPE2':
                        bitfield |= 0b00000010;
                        break;
                }
            });
            return bitfield;
        },
        getBitfieldFromDcList: function (list) {
            let bitfield = 0;
            list.forEach(function(item, index, arr){
                switch (item.chnlTp)
                {
                    case 'DC_CCS1':
                        bitfield |= 0b00000001;
                        break;
                    case 'DC_CCS2':
                        bitfield |= 0b00000010;
                        break;
                    case 'DC_CHADEMO':
                        bitfield |= 0b00000100;
                        break;
                    case 'DC_SUPERCHARGER':
                        bitfield |= 0b00001000;
                        break;
                    case 'DC_COMBO2BUS':
                        bitfield |= 0b10000000;
                        break;
                }
            });
            return bitfield;
        },
    }
}());

var cimBitfield = (function () {
    return {
        getBitfieldFromJQUERYCheckbox: function (elements) {
            let bitfield = 0;
            for(let i=0; i<elements.length; i++){
                let element = elements[i][1];

                if(element.is(':checked')){
                    //let cur_bit = 0b00000001 << i;
                    let cur_bit = elements[i][0];
                    bitfield |= cur_bit;
                }
            }
            return bitfield;
        },
        getBitfieldFromJQUERYCheckbox: function (elements) {
            let bitfield = 0;
            for(let i=0; i<elements.length; i++){
                let element = elements[i][1];

                if(element.is(':checked')){
                    //let cur_bit = 0b00000001 << i;
                    let cur_bit = elements[i][0];
                    bitfield |= cur_bit;
                }
            }
            return bitfield;
        },
        setJQUERYCheckboxFromBitfield: function (elements, bitfield) {
            for(let i=0; i<elements.length; i++) {
                let bitvalue = elements[i][0];
                let element = elements[i][1];

                let checked = bitfield&bitvalue?true:false;
                let isDisabled = elements[i][1].attr("disabled");
                if(isDisabled){
                    elements[i][1].attr("disabled", false);
                }
                elements[i][1].prop('checked', checked).change();
                if(isDisabled){
                    elements[i][1].attr("disabled", true);
                }
            }
        },
        setJQUERYCheckboxFromBoolean: function (elements) {
            for(let i=0; i<elements.length; i++) {
                let element = elements[i][0];
                let checked = elements[i][1];

                let isDisabled = element.attr("disabled");
                if(isDisabled){
                    element.attr("disabled", false);
                }
                element.prop('checked', checked).change();
                if(isDisabled){
                    element.attr("disabled", true);
                }
            }
        }
    }
}());

// ac : 0b00000001 : type1
// ac : 0b00000010 : type2
// ac : 0b00000100 : gb/t
var cimACConnectorType = (function () {
    return {
        isUsable_type1: function (bitfield) {
            return 0b00000001 & bitfield;
        },
        isUsable_type2: function (bitfield) {
            return 0b00000010 & bitfield;
        },
        isUsable_gbt: function (bitfield) {
            return 0b00000100 & bitfield;
        }
    }
}());

// dc : 0b00000001 : ccs1
// dc : 0b00000010 : ccs2
// dc : 0b00000100 : chademo
// dc : 0b00001000 : supercharger
// dc : 0b00010000 : gb/t
// dc : 0b10000000 : combo2bus
var cimDCConnectorType = (function () {
    return {
        isUsable_ccs1: function (bitfield) {
            return 0b00000001 & bitfield;
        },
        isUsable_ccs2: function (bitfield) {
            return 0b00000010 & bitfield;
        },
        isUsable_chademo: function (bitfield) {
            return 0b00000100 & bitfield;
        },
        isUsable_supercharger: function (bitfield) {
            return 0b00001000 & bitfield;
        },
        isUsable_gbt: function (bitfield) {
            return 0b00010000 & bitfield;
        },
        isUsable_combo2bus: function (bitfield) {
            return 0b10000000 & bitfield;
        }
    }
}());

// 0b00000001 : normal
// 0b00000010 : share
// 0b00000100 : pm
// 0b00001000 : v2g
var cimChargerType = (function () {
    return {
        isUsable_normal: function (bitfield) {
            return 0b00000001 & bitfield;
        },
        isUsable_share: function (bitfield) {
            return 0b00000010 & bitfield;
        },
        isUsable_pm: function (bitfield) {
            return 0b00000100 & bitfield;
        },
        isUsable_v2g: function (bitfield) {
            return 0b00001000 & bitfield;
        }
    }
}());

var cimAddDataTableRender = (function () {
    return {
        SprtAcCnctrType: function (data) {
            let bitfield = data.sprtAcCnctrType;
            var html = "<div style='display:flex; justify-content:center;'>";
            if(cimACConnectorType.isUsable_type1(bitfield)) {
                html += "<span class='icon-cim-ac-type1' data-toggle='tooltip' title='ac type1'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-ac-type1-disabled' data-toggle='tooltip' title='ac type1'></span>&nbsp;";
            }
            if(cimACConnectorType.isUsable_type2(bitfield)) {
                html += "<span class='icon-cim-ac-type2' data-toggle='tooltip' title='ac type2'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-ac-type2-disabled' data-toggle='tooltip' title='ac type2'></span>&nbsp;";
            }
            html += "</div>";
            return html;
        },
        SprtDcCnctrType: function (data) {
            let bitfield = data.sprtDcCnctrType;
            var html = "<div style='display:flex; justify-content:center;'>";
            if(cimDCConnectorType.isUsable_ccs1(bitfield)) {
                html += "<span class='icon-cim-dc-ccs1' data-toggle='tooltip' title='dc ccs1'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-dc-ccs1-disabled' data-toggle='tooltip' title='dc ccs1'></span>&nbsp;";
            }
            if(cimDCConnectorType.isUsable_ccs2(bitfield)) {
                html += "<span class='icon-cim-dc-ccs2' data-toggle='tooltip' title='dc ccs2'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-dc-ccs2-disabled' data-toggle='tooltip' title='dc ccs2'></span>&nbsp;";
            }
            if(cimDCConnectorType.isUsable_chademo(bitfield)) {
                html += "<span class='icon-cim-dc-chademo' data-toggle='tooltip' title='dc chademo'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-dc-chademo-disabled' data-toggle='tooltip' title='dc chademo'></span>&nbsp;";
            }
            if(cimDCConnectorType.isUsable_supercharger(bitfield)) {
                html += "<span class='icon-cim-dc-supercharger' data-toggle='tooltip' title='dc supercharger'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-dc-supercharger-disabled' data-toggle='tooltip' title='dc supercharger'></span>&nbsp;";
            }
            if(cimDCConnectorType.isUsable_combo2bus(bitfield)) {
                html += "<span class='icon-cim-dc-combo2' data-toggle='tooltip' title='dc combo2 bus'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-dc-combo2-disabled' data-toggle='tooltip' title='dc combo2 bus'></span>&nbsp;";
            }
            html += "</div>";
            return html;
        },
        ChrgrClsfFromCd: function (row) {
            let bitfield = row["chrgrClsf"];
            var html = "<div style='display:flex; justify-content:center;'>";
            if(bitfield == "NORMAL") {
                html += "<span class='icon-cim-chrgr-clasf-normal' data-toggle='tooltip' title='normal'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-normal-disabled' data-toggle='tooltip' title='normal'></span>&nbsp;";
            }
            if(bitfield == "SHARE") {
                html += "<span class='icon-cim-chrgr-clasf-share' data-toggle='tooltip' title='share'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-share-disabled' data-toggle='tooltip' title='share'></span>&nbsp;";
            }
            if(bitfield == "PM") {
                html += "<span class='icon-cim-chrgr-clasf-pm' data-toggle='tooltip' title='pm'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-pm-disabled' data-toggle='tooltip' title='pm'></span>&nbsp;";
            }
            if(bitfield == "V2G") {
                html += "<span class='icon-cim-chrgr-clasf-v2g' data-toggle='tooltip' title='v2g'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-v2g-disabled' data-toggle='tooltip' title='v2g'></span>&nbsp;";
            }
            html += "</div>";
            return html;
        },
        ChrgrClsfFromFlags: function (isV2G) {
            var html = "<div style='display:flex; justify-content:center;'>";
            if(isV2G) {
                html += "<span class='icon-cim-chrgr-clasf-v2g' data-toggle='tooltip' title='v2g'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-v2g-disabled' data-toggle='tooltip' title='v2g'></span>&nbsp;";
            }
            html += "</div>";
            return html;
        },
        SprtChrgrClsfFromBitfield: function (row) {
            let bitfield = row["sprtChrgrClsf"];
            var html = "<div style='display:flex; justify-content:center;'>";
            if(cimChargerType.isUsable_normal(bitfield)) {
                html += "<span class='icon-cim-chrgr-clasf-normal' data-toggle='tooltip' title='normal'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-normal-disabled' data-toggle='tooltip' title='normal'></span>&nbsp;";
            }
            if(cimChargerType.isUsable_share(bitfield)) {
                html += "<span class='icon-cim-chrgr-clasf-share' data-toggle='tooltip' title='share'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-share-disabled' data-toggle='tooltip' title='share'></span>&nbsp;";
            }
            if(cimChargerType.isUsable_pm(bitfield)) {
                html += "<span class='icon-cim-chrgr-clasf-pm' data-toggle='tooltip' title='pm'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-pm-disabled' data-toggle='tooltip' title='pm'></span>&nbsp;";
            }
            if(cimChargerType.isUsable_v2g(bitfield)) {
                html += "<span class='icon-cim-chrgr-clasf-v2g' data-toggle='tooltip' title='v2g'></span>&nbsp;";
            }else{
                html += "<span class='icon-cim-chrgr-clasf-v2g-disabled' data-toggle='tooltip' title='v2g'></span>&nbsp;";
            }
            html += "</div>";
            return html;
        }
    }
}());
