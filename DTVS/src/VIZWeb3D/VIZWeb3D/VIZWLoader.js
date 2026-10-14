/**
 * @author jhjang@softhills.net
 */

define(
    [],
    function () {

        const ContentsType = {
            CTUnknown : 0,				//!< [사용안함, 기본값]알수없는 블럭
            CTGeneralBinaryBlock : 1,	//!< [사용안함]
            CTStructure : 2,			//!< 어셈블리/파트 구조정보
            CTMeshBlock : 3,			//!< [사용안함] 메시블럭
            CTClashTestData : 4,		//!< [간섭검사전용] 클래시테스트 데이터
            CTImageData : 5,			//!< [간섭검사전용] 이미지 데이터
            CTImageIdxTable : 6,		//!< [간섭검사전용] 이미지 인덱스 테이블
            CTMeshBlockTable : 7,		//!< [사용안함] 메시블럭 테이블
            CTEntityBinaryBlock : 8,	//!< [그래픽코어] 추가 바이너리 블럭
            CTBodyMeshData : 9,			//!< 바디 메시 데이터. 구조와 별도로 저장됨
            CTPropDic : 10,				//!< 여러 노드에서 공유되는 프로퍼티
            CTUserDefGroups : 11,		//!< 사용자지정 그룹
            CTFileMetaData : 12,			//!< 파일메타데이터
            CTAuthority : 13,			//!< 오쏘리티데이터

            // 2015. 3. 10 - 지연 로딩 지원을 위한 컨텐츠
            CTNodePropTable : 14,		//!< 노드별 프로퍼티. 프로퍼티 지연로딩 지원
            CTNodePropTableIndices : 15, //!< 노드별 프로퍼티 인덱스목록. 프로퍼티 지연로딩 지원
            CTInitialInfo : 16,			//!< 초기에 보여줄 정보 관련 (계획만됨. 현재 사용되지 않음)

            CTUserCustom : 17,			//!< CT 타입 upper bound 로만 사용됨.
            CTEdgeTable : 18,            //!< Mobile EdgeTable
            CTThumbnail : 19,            //!< Thumbnail Image -  2016.03.22
            CTMisc : 20,                 //!< folder, point, curve, clircle 등 기타 데이타 저장 - 2016.03.28  
            CTStructureHeader : 21,       //!< 어셈블리/파트 신규 구조정보
            CTMeshBlockSub: 22,			//!< 메시블럭내 데이터 초과시 추가적으로 저장
            CTVIZWFileAxisInfo: 42,     // Axis Info
            CTVIZWFileFreeEdgeInfo: 43     // Edge Info
        };

        const DataSize = {
            int: 4,
            float: 4,
            CFUInt8: 1,
            CFUInt16: 2,
            CFSize: 4,
        };

        function VIZWLoader() {
           
        }

        VIZWLoader.prototype = {
            constructor: VIZWLoader,
            parsetype : 1,
            load: function (data, onLoad, datamng, onProgress, browser) {
                var scope = this;
                scope.parse(data, onLoad, datamng, onProgress, browser);
            },

            parse: function (data, onload, datamng, onProgress, browser) {
                var parseOnload = onload;

                var triangleCount = 0;

                function vector(x, y, z) {
                    return new THREE.Vector3(x, y, z);
                }

                function uv(u, v) {
                    return new THREE.Vector2(u, v);
                }

                function buffface3(a, b, c, color) {
                    //return new THREE.Face3(a, b, c, normals);
                    return { a: a, b: b, c: c, color: color };
                }
                function face3(a, b, c, normals) {
                    return new THREE.Face3(a, b, c, normals);
                }

                var group = new THREE.Group();
                var object = group;
                //var object = new THREE.Object3D();

                var buffgeom = new THREE.BufferGeometry();
                var material = new THREE.MeshLambertMaterial();
                var mesh = new THREE.Mesh(buffgeom, material);

                var faces = [];
                var vertices = [];
                var normals = [];
                var uvs = [];
                var colors = [];
                var color = new THREE.Color();

                function add_face(a, b, c, normals_inds) {
                    if (normals_inds === undefined) {
                        geometry.faces.push(face3(
                            parseInt(a) - (face_offset + 1),
                            parseInt(b) - (face_offset + 1),
                            parseInt(c) - (face_offset + 1)
                        ));
                    } else {
                        geometry.faces.push(face3(
                            parseInt(a) - (face_offset + 1),
                            parseInt(b) - (face_offset + 1),
                            parseInt(c) - (face_offset + 1),
                            [
                                normals[parseInt(normals_inds[0]) - 1].clone(),
                                normals[parseInt(normals_inds[1]) - 1].clone(),
                                normals[parseInt(normals_inds[2]) - 1].clone()
                            ]
                        ));
                    }
                }

                function add_uvs(a, b, c) {
                    geometry.faceVertexUvs[0].push([
                        uvs[parseInt(a) - 1].clone(),
                        uvs[parseInt(b) - 1].clone(),
                        uvs[parseInt(c) - 1].clone()
                    ]);
                }

                function handle_face_line(faces, uvs, normals_inds) {
                    if (faces[3] === undefined) {
                        add_face(faces[0], faces[1], faces[2], normals_inds);
                        if (!(uvs === undefined) && uvs.length > 0) {
                            add_uvs(uvs[0], uvs[1], uvs[2]);
                        }
                    } else {
                        if (!(normals_inds === undefined) && normals_inds.length > 0) {
                            add_face(faces[0], faces[1], faces[3], [normals_inds[0], normals_inds[1], normals_inds[3]]);
                            add_face(faces[1], faces[2], faces[3], [normals_inds[1], normals_inds[2], normals_inds[3]]);
                        } else {
                            add_face(faces[0], faces[1], faces[3]);
                            add_face(faces[1], faces[2], faces[3]);
                        }

                        if (!(uvs === undefined) && uvs.length > 0) {
                            add_uvs(uvs[0], uvs[1], uvs[3]);
                            add_uvs(uvs[1], uvs[2], uvs[3]);
                        }
                    }
                }

                function SetBufferGeometry(datamanager, filename) {
                    object.name = filename;

                    for (var j = 0; j < datamanager.list_colormesh.length; j++) {
                        var colormesh = datamanager.list_colormesh[j];

                        var parts = [];

                        var buffgeom = new THREE.BufferGeometry();
                        var nTriCount = 0;
                        for (var i = 0; i < colormesh.meshes.length; i++) {
                            nTriCount += colormesh.meshes[i].faces.length;
                        }

                        var triangles = nTriCount; //colormesh.meshes[i].faces.length;

                        var buffpos = new Float32Array(triangles * 3 * 3);
                        var buffnormal = new Float32Array(triangles * 3 * 3);

                        nTriCount = 0;
                        var nTreeCount = datamng.GetTreeCount();
                        for (var i = 0; i < colormesh.meshes.length; i++) {
                            var min = vector(0, 0, 0);
                            var max = vector(0, 0, 0);

                            colormesh.meshes[i].faces.forEach(function (face, index) {
                                //index += nTriCount;
                                if (index === 0) {
                                    min.x = vertices[face.a].x;
                                    min.y = vertices[face.a].y;
                                    min.z = vertices[face.a].z;

                                    max.x = vertices[face.a].x;
                                    max.y = vertices[face.a].y;
                                    max.z = vertices[face.a].z;
                                }

                                buffpos[index * 9 + 0 + nTriCount] = vertices[face.a].x;
                                buffpos[index * 9 + 1 + nTriCount] = vertices[face.a].y;
                                buffpos[index * 9 + 2 + nTriCount] = vertices[face.a].z;
                                buffpos[index * 9 + 3 + nTriCount] = vertices[face.b].x;
                                buffpos[index * 9 + 4 + nTriCount] = vertices[face.b].y;
                                buffpos[index * 9 + 5 + nTriCount] = vertices[face.b].z;
                                buffpos[index * 9 + 6 + nTriCount] = vertices[face.c].x;
                                buffpos[index * 9 + 7 + nTriCount] = vertices[face.c].y;
                                buffpos[index * 9 + 8 + nTriCount] = vertices[face.c].z;

                                buffnormal[index * 9 + 0 + nTriCount] = normals[face.a].x;
                                buffnormal[index * 9 + 1 + nTriCount] = normals[face.a].y;
                                buffnormal[index * 9 + 2 + nTriCount] = normals[face.a].z;
                                buffnormal[index * 9 + 3 + nTriCount] = normals[face.b].x;
                                buffnormal[index * 9 + 4 + nTriCount] = normals[face.b].y;
                                buffnormal[index * 9 + 5 + nTriCount] = normals[face.b].z;
                                buffnormal[index * 9 + 6 + nTriCount] = normals[face.c].x;
                                buffnormal[index * 9 + 7 + nTriCount] = normals[face.c].y;
                                buffnormal[index * 9 + 8 + nTriCount] = normals[face.c].z;

                                min = datamng.Min(min, vertices[face.a]);
                                min = datamng.Min(min, vertices[face.b]);
                                min = datamng.Min(min, vertices[face.c]);

                                max = datamng.Max(max, vertices[face.a]);
                                max = datamng.Max(max, vertices[face.b]);
                                max = datamng.Max(max, vertices[face.c]);
                            });

                            var part = datamng.Part(colormesh.meshes[i].ID, colormesh.meshes[i].name, nTriCount, colormesh.meshes[i].faces.length * 9, colormesh.color, { min: min, max: max }, null, null);
                            parts.push(part);

                            nTriCount += colormesh.meshes[i].faces.length * 9;
                        }

                        buffgeom.addAttribute('position', new THREE.BufferAttribute(buffpos, 3));
                        buffgeom.addAttribute('normal', new THREE.BufferAttribute(buffnormal, 3));
                        //buffgeom.addAttribute('parts', new THREE.BufferAttribute(parts, 1));
                        buffgeom.computeBoundingSphere();

                        var colorIndex = colormesh.color;
                        var colorTmp = RGB2HEX(parseInt(datamng.mColors[colorIndex].r), parseInt(datamng.mColors[colorIndex].g), parseInt(datamng.mColors[colorIndex].b));
                        var material = new THREE.MeshPhongMaterial({
                            color: colorTmp,
                            side: THREE.DoubleSide,
                            transparent: true,
                            vertexColors: THREE.NoColors,
                            opacity: datamng.mColors[colorIndex].a,
                            //flatShading: THREE.SmoothShading,
                        });
                        mesh = new THREE.Mesh(buffgeom, material);
                        mesh.castShadow = true;
                        mesh.receiveShadow = true;

                        for (var partIdx = 0; partIdx < parts.length; partIdx++) {
                            parts[partIdx].mesh = mesh;

                            // 파트 관리(검색 속도 향상)
                            datamng.SetPartData(parts[partIdx]);
                        }

                        if (!mesh.userData.init) {
                            var tag = datamanager.Tag();
                            tag.color = colorIndex;
                            tag.parts = parts;
                            mesh.userData = tag;
                        }

                        object.add(mesh);
                    }
                    datamng.Clear();
                }

                function RGB2HEX(r, g, b) {
                    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                }

                function OLE2HEX(color) {
                    return "#" + color.toString(16).slice(2);
                }

                function hexToRgbA(hex) {
                    var c;
                    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
                        c = hex.substring(1).split('');
                        if (c.length === 3) {
                            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                        }
                        c = '0x' + c.join('');
                        return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',1)';
                    }
                    throw new Error('Bad Hex');
                }

                async function asyncParse(result) {
                    parseData_vHMF(result);
                }

                function getUint64(view, byteOffset, littleEndian) {
                    // split 64-bit number into two 32-bit parts
                    const left = view.getUint32(byteOffset, littleEndian);
                    const right = view.getUint32(byteOffset + 4, littleEndian);

                    // combine the two 32-bit values
                    const combined = littleEndian ? left + 2 ** 32 * right : 2 ** 32 * left + right;

                    if (!Number.isSafeInteger(combined))
                        console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');

                    return combined;
                }

                function parseData_vHMF(result) {
                    var me = this;

                    $('.loader').fadeIn(1000);

                    console.log("Data Loading Start");

                    var dataView = new DataView(result);
                    var offset = 0;

                    var header = {
                        typeStr: null, // 16
                        version: null, // 4
                        sizeTocItem : null, //4
                        nToc: null, //4
                        tocPos: null //8
                    };

                    header.version = dataView.getInt32(offset, true);
                    offset += 4;

                    function ImportStructure(view, offset) {

                        var decode_utf8 = function (s) {
                            return decodeURIComponent(escape(s));
                        };

                        let structureCnt = view.getUint32(offset, true);
                        offset += 4;
    
                        let m_mapPropList = new Map();
                        let m_mapMeshList = new Map();

                        let m_vecPropHeaderDic = [];
                        
                        for(let si = 0 ; si < structureCnt ; si++)
                        {
                            HeaderTocTableItem = {
                                index: -1,
                                type: 0,
                                entFlags: 0,
                                iNameIndex: -1,
                                attFlags: 0,
                                transfrom: [],
                                bBox: [],
                                cCount: -1,
                                pIndex: -1,
                                orgNodeID: -1,
                                pNameBuff: null,
                                tocId: 0,
                                btype: 0,
                                name : null
                            };

                            let pIndex = view.getUint32(offset, true);
                            offset += 4;
                            if(pIndex === 0) pIndex = -1;
                            
                            let pType = view.getUint32(offset, true);
                            offset += 4;

                            let index = view.getUint32(offset, true);
                            offset += 4;

                            let nodeType = view.getUint32(offset, true);
                            offset += 4;
                            
                            let nameLength = view.getUint32(offset, true);
                            offset += 4;

                            let nodeTmp = view.getUint32(offset, true);
                            offset += 4;

                            let nameStr = "";
                            if(nameLength > 0)
                            {
                                let nameBuffer = new Uint8Array(nameLength);
                                for (let j = 0; j < nameLength; j++) {
                                    nameBuffer[j] = view.getUint8(offset + j, true);
                                }
                                offset += nameLength;
                                nameStr = String.fromCharCode.apply(null, nameBuffer);
                                
                                try {
                                    // UTF-8
                                    nameStr = decode_utf8(nameStr);
                                } catch (e) {
                                    console.log(e);
                                }
                                HeaderTocTableItem.name = nameStr.replace(/\0/gi, '');
                            }
                            else 
                                HeaderTocTableItem.name = nameStr;
                            

                            
                            for (let j = 0; j < 6; j++) {
                                HeaderTocTableItem.bBox[j] = view.getFloat32(offset, true);
                                offset += 4;
                            }

                            for (let j = 0; j < 16; j++) {
                                HeaderTocTableItem.transfrom[j] = view.getFloat32(offset, true);
                                offset += 4;
                            }

                            HeaderTocTableItem.orgNodeID = index;
                            HeaderTocTableItem.pIndex = pIndex === -1 ? pIndex : pIndex + datamng.GetMaxID();
                            HeaderTocTableItem.index = index === -1 ? index : index + datamng.GetMaxID();

                            let propNum = view.getUint32(offset, true);
                            offset += 4;

                            if(propNum > 0)
                            {
                                let propList = []
                                for (let j = 0; j < propNum; j++) {
                                    propList[j] = view.getUint32(offset, true);
                                    offset += 4;
                                }
                            
                                m_mapPropList.set(HeaderTocTableItem.index, propList);
                            }   

                            let meshNum = view.getUint32(offset, true);
                            offset += 4;

                            if(meshNum > 0)
                            {
                                let meshList = []
                                for (let j = 0; j < meshNum; j++) {
                                    meshList[j] = view.getUint32(offset, true);
                                    offset += 4;
                                }
                            
                                m_mapMeshList.set(HeaderTocTableItem.index, meshList);
                            }   

                            let childNum = view.getUint32(offset, true);
                            offset += 4;

                            if(childNum > 0)
                            {
                                let childList = []
                                for (let j = 0; j < childNum; j++) {
                                    childList[j] = view.getUint32(offset, true);
                                    offset += 4;
                                }                                                                
                            }
                            
                            HeaderTocTableItem.cCount = childNum;
                            
                            if(nodeType === 0)
                                HeaderTocTableItem.type = ENTITY_TYPES.EntAssembly;
                            else if(nodeType === 1)
                                HeaderTocTableItem.type = ENTITY_TYPES.EntPart;
                            else if(nodeType === 2)
                                HeaderTocTableItem.type = ENTITY_TYPES.EntBody;
                            else if(nodeType === 3)
                                HeaderTocTableItem.type = ENTITY_TYPES.EntPart;
                            

                            m_vecPropHeaderDic.push(HeaderTocTableItem);
                        }
                        datamng.AddNodes(m_vecPropHeaderDic);

                        let ImportProperty = function (view, offset) {

                            var decode_utf8 = function (s) {
                                return decodeURIComponent(escape(s));
                            };

                            let propertyCnt = view.getUint32(offset, true);
                            offset += 4;
        
                            let readPropertyData = new Map();
                            for (let i = 0; i < propertyCnt; i++) {

                                let id = view.getUint32(offset, true);
                                offset += 4;

                                let propNum = view.getUint32(offset, true);
                                offset += 4;

                                let items = [];
                                for (let k = 0; k < propNum; k++) {
                                    var item = {
                                        key: null,
                                        value: null,
                                        valueType: null
                                    };

                                    let keyLen = view.getUint32(offset, true);
                                    offset += 4;
                                    
                                    let keyTmp = view.getUint32(offset, true);
                                    offset += 4;

                                    var keyBuffer = new Uint8Array(keyLen);
                                    for (var m = 0; m < keyLen; m++) {
                                        keyBuffer[m] = view.getUint8(offset + m, true);
                                    }
                                    offset += keyLen;
                                    item.key = String.fromCharCode.apply(null, keyBuffer);
                                    try {
                                        item.key = decode_utf8(item.key);
                                    } catch (e) {
                                    }

                                    let valueLen = view.getUint32(offset, true);
                                    offset += 4;

                                    let valueTmp = view.getUint32(offset, true);
                                    offset += 4;

                                    var valueBuffer = new Uint8Array(valueLen);
                                    for (var m = 0; m < keyLen; m++) {
                                        valueBuffer[m] = view.getUint8(offset + m, true);
                                    }
                                    offset += valueLen;
                                    item.value = String.fromCharCode.apply(null, valueBuffer);
                                    try {
                                        item.value = decode_utf8(item.value);
                                    } catch (e) {
                                    }
                                    
                                    item.valueType = view.getUint16(offset, true);
                                    offset += 2;

                                    items.push(item);
                                }

                                readPropertyData.set(id, items);
                            }
                            
                            let arrProperty = [];
                            m_mapPropList.forEach((propList, key) => {

                                var Property = {
                                    nodeId: -1,
                                    nNodeProps: 0,
                                    items : []
                                };
                                Property.nodeId = key;
                                for(let i = 0 ; i < propList.length ; i++)
                                {
                                    if(!readPropertyData.has(propList[i])) continue;

                                    const items = readPropertyData.get(propList[i]);

                                    for(let k = 0 ; k < items.length ; k++)
                                        Property.items.push(items[k]);
                                }

                                Property.nNodeProps = Property.items.length;
                                if(Property.nNodeProps > 0)
                                    arrProperty.push(Property);

                            });
                            datamng.AddUserProperty(arrProperty);

                            return offset;
                        };

                        offset = ImportProperty(view, offset);

                        
                        function ImportMeshBlock(view, offset)
                        {
                            let meshCnt = view.getUint32(offset, true);
                            offset += 4;

                            let meshDataList = new Map();
                            let geometryDataList = new Map();
                            for(let mi = 0 ; mi < meshCnt ; mi++)
                            {
                                let id = view.getUint32(offset, true);
                                offset += 4;

                                let colorR = view.getFloat32(offset, true);
                                offset += 4;
                                let colorG = view.getFloat32(offset, true);
                                offset += 4;
                                let colorB = view.getFloat32(offset, true);
                                offset += 4;
                                let colorA = view.getFloat32(offset, true);
                                offset += 4;

                                let color = {
                                    R: parseInt(colorR * 255),
                                    G: parseInt(colorG * 255),
                                    B: parseInt(colorB * 255),
                                    A: parseInt(colorA * 255)
                                };

                                let vnSize = view.getUint32(offset, true);
                                offset += 4;

                                let triSize = view.getUint32(offset, true);
                                offset += 4;

                                // let vtArray = new Float32Array(view, offset, vnSize * 3);
                                // offset += vnSize * 4 * 3;

                                // let vnArray = new Float32Array(view, offset, vnSize * 3);
                                // offset += vnSize * 4 * 3;

                                // let triArray = new Uint32Array(view, offset, triSize);
                                // offset += triSize * 4;

                                let vtArray = new Float32Array(vnSize * 3);
                                for (let j = 0; j < vnSize * 3; j++) {
                                    vtArray[j] = view.getFloat32(offset, true);
                                    offset += 4;
                                }

                                let vnArray = new Float32Array(vnSize * 3);
                                for (let j = 0; j < vnSize * 3; j++) {
                                    vnArray[j] = view.getFloat32(offset, true);
                                    offset += 4;
                                }

                                let triArray = undefined;
                                
                                if(false)
                                {
                                    triArray = new Uint32Array(triSize);
                                    for (let j = 0; j < triSize; j++) {
                                        triArray[j] = view.getUint32(offset, true);
                                        offset += 4;
                                    }
                                }
                                else 
                                {                            
                                    triArray = new Uint16Array(triSize);
                                    for (let j = 0; j < triSize; j++) {
                                        triArray[j] = view.getUint16(offset, true);
                                        offset += 2;
                                    }
        
                                }



                                meshDataList.set(id, {
                                    color : color,
                                    vnSize : vnSize,
                                    triSize : triSize
                                });


                                let geometry = new THREE.BufferGeometry();
                                geometry.setIndex(new THREE.Uint32BufferAttribute(triArray, 1));
                                geometry.addAttribute('position', new THREE.Float32BufferAttribute(vtArray, 3));
                                geometry.addAttribute('normal', new THREE.Float32BufferAttribute(vnArray, 3));

                                let colorNum  = vtArray.length / 3 * 4;
                                let colors = [];
                                for (let k = 0; k < colorNum; k = k + 4) {

                                    colors.push(color.R);
                                    colors.push(color.G);
                                    colors.push(color.B);
                                    colors.push(color.A);
                                }
                                let colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
                                colorAttribute.normalized = true;
                                geometry.addAttribute('color', colorAttribute);
                                geometry.computeBoundingSphere();

                                
                                mesh = new THREE.Mesh(geometry, datamng.Materials.basic);
                                mesh.castShadow = true;
                                mesh.receiveShadow = true;
                                
                                geometryDataList.set(id, mesh);
                                object.add(mesh);
                            }

                            
                            m_mapMeshList.forEach((meshList, key) => {
                                
                                let item = m_vecPropHeaderDic.find((item) => {
                                    return item.index == key;
                                });

                                if(item === undefined) return;
                                
                                for(let i = 0 ; i < meshList.length ; i++)
                                {
                                    let meshData = meshDataList.get(meshList[i]);
                                    if(meshData === undefined) continue;

                                    const geometryData = geometryDataList.get(meshList[i]);

                                    // color : color,
                                    // vnSize : vnSize,
                                    // triSize : triSize
                                    var data = {
                                        partId: item.pIndex,
                                        bodyId: item.index,
                                        color: meshData.color,
                                        
                                        // m_vnIdx: m_vnIdx * 3,
                                        // m_triIdx: m_triIdx * 3,
                                        // m_nVtx: MnVtx * 3,
                                        // m_nTris: MnTri * 3,

                                        m_vnIdx: 0,
                                        m_triIdx: 0,
                                        m_nVtx: meshData.vnSize * 3,
                                        m_nTris: meshData.triSize * 3,
                                        
                                        BBox: {
                                            min: {
                                                x: item.bBox[0],
                                                y: item.bBox[1],
                                                z: item.bBox[2]
                                            },
                                            max: {
                                                x: item.bBox[3],
                                                y: item.bBox[4],
                                                z: item.bBox[5]
                                            }
                                        },
                                        Tag: datamng.Tag()
                                        //mesh: mesh
                                    };

                                    if(geometryData.userData.length === undefined)
                                        geometryData.userData = [ data ];
                                    else 
                                        geometryData.userData.push(data);
                                }
                            });
                            
                            
                            
        
                        }
                        offset = ImportMeshBlock(view, offset);


                        return offset;
                    }

                    offset = ImportStructure(dataView, offset);



                    if (true) {
                        onProgress(1, 1);
                        result = null;

                        setTimeout(function () {
                            parseOnload(group, data);
                        }, 25);

                    }
                }

                function down() {
                    // arraybuffer ajax request
                    $.ajax({

                        complete: function () {
                            onProgress(0, 1);
                        },
                        url: data.Url,
                        type: "GET",
                        beforeSend: function () {  //ajax 호출전 progress 초기화
                            onProgress(0, 0, 0, 0);
                        },
                        xhr: function () {  //XMLHttpRequest 재정의 가능
                            var me = this;
                            var xhr = $.ajaxSettings.xhr();
                            xhr.responseType = "arraybuffer";

                            xhr.onprogress = function (e) {
                                var percent = e.loaded / e.total;
                                onProgress(0, percent, e.loaded, e.total);
                            };

                            xhr.addEventListener('load', function () {
                                var jQueryVer = $().jquery;
                                var res = jQueryVer.split(".");
                                var major = res[0] * 1;
                                var minor = res[1] * 1;
                                if (major <= 2 && minor < 2)
                                    me.success(xhr.response);
                            });

                            return xhr;
                        },
                        //dataType: 'binary',
                        responseType: 'arraybuffer',
                        processData: false, // arraybuffer -> need
                        async: true,
                        success: function (result) {
                            console.log("File Downloading Finish");
                            asyncParse(result);
                            //result.slice(0, result.length);
                            result = null;
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            console.log(xhr.status);
                            console.log(thrownError);
                        }

                    });
                }
                function down_Edge() {
                    $.ajax({
                        url: data.Url,
                        type: "GET",
                        dataType: 'binary',
                        responseType: 'arraybuffer',
                        processData: false,
                        async: false,
                        success: function (result) {
                            asyncParse(result);
                        },
                        error: function (xhr, ajaxOptions, thrownError) {
                            console.log(xhr.status);
                            console.log(thrownError);
                        }
                    });
                }
               
                //if (browser.Name.localeCompare("Chrome") === 0)
                if (browser.Type === BROWSER_TYPES.Edge
                    || browser.Type === BROWSER_TYPES.Internet_Explorer)
                    down_Edge();
                else
                    down();

            },
        };

        return VIZWLoader;
    }
);