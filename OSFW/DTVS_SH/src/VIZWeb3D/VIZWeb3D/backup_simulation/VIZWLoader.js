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
            CTMeshBlockSub : 22,			//!< 메시블럭내 데이터 초과시 추가적으로 저장
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
                    parseData_v301(result);
                }

                function parseData(result) {
                    $('.loader').fadeIn(500);

                    var vertexCountTotal = 0;
                    var m_nVtx = 0;
                    var offset = 0;
                    var dataView = new DataView(result);
                    var version = dataView.getInt32(offset, true);
                    offset += 4;
                    var partCount = dataView.getInt32(offset, true);
                    offset += 4;
                    //console.log("PART COUNT : " + partCount);

                    var colorCount = dataView.getInt32(offset, true);
                    offset += 4;
                    //console.log("COLOR COUNT : " + colorCount);

                    var reviewCount = dataView.getInt32(offset, true);
                    offset += 4;
                    //console.log("REVIEW COUNT : " + reviewCount);

                    // 노드 갯수
                    var nodeCount = dataView.getInt32(offset, true);
                    offset += 4;

                    var nTreeCount = datamng.GetTreeCount();
                    var nDatamngColorCount = datamng.GetColorCount();

                    var loading_node = function () {
                        // 노드 정보
                        for (var i = 0; i < nodeCount; i++) {

                            // ID
                            var nodeId = dataView.getInt32(offset, true);
                            offset += 4;
                            // PID
                            var nodePId = dataView.getInt32(offset, true);
                            offset += 4;

                            var vminx = dataView.getFloat32(offset, true);
                            var vminy = dataView.getFloat32(offset + 4, true);
                            var vminz = dataView.getFloat32(offset + 8, true);

                            offset += 12;

                            var vmaxx = dataView.getFloat32(offset, true);
                            var vmaxy = dataView.getFloat32(offset + 4, true);
                            var vmaxz = dataView.getFloat32(offset + 8, true);

                            offset += 12;

                            var bboxMin = vector(vminx, vminy, vminz);
                            var bboxMax = vector(vmaxx, vmaxy, vmaxz);
                            var bbox = { min: bboxMin, max: bboxMax };

                            var children = [];

                            if (nodePId !== -1) {
                                nodeId = nodeId + nTreeCount;
                                nodePId = nodePId + nTreeCount;
                            }
                            else {
                                nodeId = nodeId + nTreeCount;
                            }

                            datamng.SetTreeData({ ID: nodeId, PID: nodePId, bbox: bbox, children: children });
                        }
                        // 트리 정보 생성
                        datamng.SetTreeHierarchy(filename);

                        setTimeout(function () {
                            loading();
                        }, 25);
                    };

                    vertices = [];
                    normals = [];
                    //colors = [];

                    color.setRGB(255, 255, 255);

                    var nPercent = 0;

                    var progressbar = $('#progress');
                    var bar = $('#bar');
                    var width = progressbar.width();

                    var LoadingCount = 0;
                    var MaxLoadingCount = 50;
                    var callFunction = true;
                    var loading = function () {

                        nPercent = LoadingCount / partCount * 100;
                        onProgress(nPercent);
                        bar.width(width / 100 * nPercent);

                        for (var i = 0; i < MaxLoadingCount; i++) {
                            if (LoadingCount === partCount) {

                                loading_color();
                                onProgress(100);
                                bar.width(width);
                                $('.loader').fadeOut(500);

                                setTimeout(function () {
                                    parseOnload(group);
                                }, 500);
                                
                                callFunction = false;
                                break;
                            }

                            // part PID
                            var partID = dataView.getInt32(offset, true);
                            partID = partID + nTreeCount;
                            offset += 4;

                            var nameLength = dataView.getInt32(offset, true);
                            offset += 4;

                            var partName = "";
                            var nameBuffer = new Uint8Array(nameLength);
                            for (var j = 0; j < nameLength; j++) {
                                nameBuffer[j] = dataView.getUint8(offset + j, true);
                            }
                            partName = String.fromCharCode.apply(null, nameBuffer);
                            
                            if (partName.localeCompare("Part 1 of /6501-SHAFT") === 0
                            ) {
                                console.log("");
                            }
                            offset += nameLength;

                            var faces = [];
                            var colortable = [];

                            var bodyCount = dataView.getInt32(offset, true);
                            offset += 4;
                            //console.log("BODY COUNT : " + bodyCount);

                            for (var j = 0; j < bodyCount; j++) {

                                var triSetCount = dataView.getInt32(offset, true);
                                offset += 4;
                                //console.log("TRIANGLE SET COUNT : " + triSetCount);

                                face_offset = m_nVtx;

                                for (var k = 0; k < triSetCount; k++) {

                                    var bodyNameLength = dataView.getInt32(offset, true);
                                    offset += 4;
                                    //console.log("BODY NAME LEGNTH : " + bodyNameLength);

                                    var bodyName = "";
                                    var bodyNameBuffer = new Uint8Array(bodyNameLength);
                                    for (var l = 0; l < bodyNameLength; l++) {
                                        bodyNameBuffer[l] = dataView.getUint8(offset + l, true);
                                    }
                                    bodyName = String.fromCharCode.apply(null, bodyNameBuffer);
                                    offset += bodyNameLength;
                                    //console.log("BODY NAME : " + bodyName);
                                    //console.log("o %s", bodyName);                            

                                    var colorIndex = dataView.getInt32(offset, true);

                                    // Datamng 컬러 테이블 추가
                                    colorIndex = colorIndex + nDatamngColorCount;

                                    var containsColorIdx = -1;
                                    for (var colortableIdx = 0; colortableIdx < colortable.length; colortableIdx++) {
                                        if (colortable[colortableIdx].colorIdx === colorIndex) {
                                            containsColorIdx = colortableIdx;
                                            break;
                                        }
                                    }

                                    if (containsColorIdx === -1) {
                                        colortable.push({ colorIdx: colorIndex, count: 1 });
                                    }
                                    else {
                                        colortable[containsColorIdx].count = colortable[containsColorIdx].count + 1;
                                    }

                                    offset += 4;
                                    //console.log("COLOR INDEX : " + colorIndex);                        
                                    //console.log("usemtl col_%d", colorIndex);
                                    var usemtl = "col_" + colorIndex;

                                    var vertexCount = dataView.getInt32(offset, true);
                                    vertexCountTotal = vertexCountTotal + vertexCount;
                                    offset += 4;
                                    //console.log("VERTEX COUNT : " + vertexCount);

                                    for (var l = 0; l < vertexCount; l++) {
                                        var v1 = dataView.getFloat32(offset, true);
                                        var v2 = dataView.getFloat32(offset + 4, true);
                                        var v3 = dataView.getFloat32(offset + 8, true);

                                        offset += 12;
                                        //console.log("VERTEX : " + v1 + " / " + v2 + " / " + v3);
                                        //console.log("v %f %f %f", v1, v2, v3);
                                        {// vertices
                                            vertices.push(vector(v1, v2, v3));
                                            m_nVtx++;
                                        }
                                    }
                                    


                                    var vertexNormalCount = dataView.getInt32(offset, true);
                                    offset += 4;
                                    //console.log("VERTEX NORMAL COUNT : " + vertexNormalCount);

                                    for (var l = 0; l < vertexNormalCount; l++) {
                                        var vn1 = dataView.getFloat32(offset, true);
                                        var vn2 = dataView.getFloat32(offset + 4, true);
                                        var vn3 = dataView.getFloat32(offset + 8, true);

                                        offset += 12;
                                        //console.log("VERTEX NORMAL : " + vn1 + " / " + vn2 + " / " + vn3);
                                        //console.log("vn %f %f %f", vn1, vn2, vn3);
                                        {// Normals
                                            normals.push(vector(vn1, vn2, vn3));
                                        }
                                    }

                                    var faceCount = dataView.getInt32(offset, true);
                                    offset += 4;
                                    //console.log("FACE COUNT : " + faceCount);

                                    for (var l = 0; l < faceCount; l++) {
                                        var f1 = dataView.getInt32(offset, true);
                                        var f2 = dataView.getInt32(offset + 4, true);
                                        var f3 = dataView.getInt32(offset + 8, true);

                                        offset += 12;
                                        {// face
                                            faces.push(buffface3(
                                                f1 - 1,
                                                f2 - 1,
                                                f3 - 1,
                                                colorIndex
                                            ));
                                        }
                                    }
                                } // tri set count
                            } // body count

                            var colorTmp = { Idx: -1, count: -1 };
                            for (var tc = 0; tc < colortable.length; tc++) {
                                if (tc === 0) {
                                    colorTmp.Idx = colortable[tc].colorIdx;
                                    colorTmp.count = colortable[tc].count;
                                }
                                else {
                                    if (colortable[tc].count > colorTmp.count) {
                                        colorTmp.Idx = colortable[tc].colorIdx;
                                        colorTmp.count = colortable[tc].count;
                                    }
                                }
                            }

                            // 형상이 없는 정보는 처리 하지 않음
                            if (bodyCount !== 0) {
                                // 메쉬 관리 추가
                                datamng.AddMesh(
                                    partName,
                                    face_offset,
                                    vertexCount,
                                    colorTmp.Idx,
                                    //colorIndex,
                                    faces,
                                    partID
                                );
                                //console.log(offset);
                            }

                            LoadingCount++;
                        }

                        if (callFunction)
                            setTimeout(function () {
                                loading();
                            }, 25);
                    };
                    setTimeout(function () {
                        loading_node();
                    }, 500);

                    var loading_color = function () {
                        for (var j = 0; j < colorCount; j++) {
                            var colorIndex = dataView.getInt32(offset, true);
                            // DataManager 컬러 테이블 추가
                            colorIndex = colorIndex + nDatamngColorCount;
                            offset += 4;
                            //console.log("COLOR INDEX : " + colorIndex);
                            //console.log("newmtl col_%d", colorIndex);
                            var r = dataView.getFloat32(offset, true);
                            var g = dataView.getFloat32(offset + 4, true);
                            var b = dataView.getFloat32(offset + 8, true);

                            var a = 0;
                            if (version === 1) {
                                offset += 12;
                            }
                            else if (version === 2) {
                                a = dataView.getFloat32(offset + 12, true);
                                offset += 16;
                            }
                            //console.log("COLOR : " + r + " / " + g + " / " + b);
                            //console.log("Kd %f %f %f", r, g, b);
                            //console.log("Ks 0.50 0.50 0.50");
                            //console.log("Ns 18.00");
                            // colors[colorIndex] = { index: colorIndex, r: r * 255, g: g * 255, b: b * 255, a: a };
                            datamng.mColors[colorIndex] = { index: colorIndex, r: r * 255, g: g * 255, b: b * 255, a: a };
                        }
                        SetBufferGeometry(datamng, filename); 
                    };

                    // 콜백
                    //parseOnload(object);
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

                function parseData_v301(result) {
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

                    var buffer = new Uint8Array(result, offset, 16);
                    header.typeStr = String.fromCharCode.apply(null, buffer);
                    offset += 16;
                    header.version = dataView.getInt32(offset, true);
                    offset += 4;
                    header.sizeTocItem = dataView.getInt32(offset, true);
                    offset += 4;
                    header.nToc = dataView.getInt32(offset, true);
                    offset += 4;

                    header.tocPos = getUint64(dataView, offset, true);
                    offset += 8;

                    var m_toc = [];
                    
                    // read toc
                    var nTocOfThisSeg = 0;
                    var nextPos = 0;
                    var m_StreamCurrentPosition = header.tocPos;

                    nTocOfThisSeg = dataView.getInt32(m_StreamCurrentPosition, true);
                    m_StreamCurrentPosition += 4;
                    nextPos = getUint64(dataView, m_StreamCurrentPosition, true);
                    m_StreamCurrentPosition += 8;
                    var m_curTocIdx = header.nToc - 1;
                    //for (var i = 1; i <= nTocOfThisSeg; i++) {
                    //    ReadTocItem(header.nToc - i);
                    //}
                    for (var i = 0; i < nTocOfThisSeg; i++) {
                        ReadTocItem(i);
                    }

                    function ReadTocItem(tocIdx) {
                        var itemPos = header.tocPos + 12 + (tocIdx * header.sizeTocItem);

                        // Core에서 8ㅠyte로 써짐 뒤 4byte는 더미데이터
                        var type = dataView.getInt32(itemPos, true);
                        itemPos += 8;
                        var position = getUint64(dataView, itemPos, true);
                        itemPos += 8;
                        var dataSize = dataView.getUint32(itemPos, true);
                        itemPos += 4;
                        var uncompSize = dataView.getUint32(itemPos, true);
                        itemPos += 4;
                        var parsetype = 0;
                        if (scope.Parse.parsetype === 1) {
                            parsetype = dataView.getUint32(itemPos, true);
                            itemPos += 4;
                        }

                        var toc = {
                            type: type,
                            position: position,
                            datasize: dataSize,
                            uncompsize: uncompSize,
                            parsetype: parsetype
                        };
                        m_toc.push(toc);
                    }

                    function FindLast(ctt) {
                        var tocIdx = -1;
                        for (var i = m_toc.length - 1; i >= 0; i--) {
                            if (m_toc[i].type === ctt) {
                                tocIdx = i;
                                break;
                            }
                        }
                        return tocIdx;
                    }

                    function FindFirst(ctt) {
                        var tocIdx = -1;
                        for (var i = 0; i < m_toc.length; i++) {
                            if (m_toc[i].type === ctt) {
                                tocIdx = i;
                                break;
                            }
                        }
                        return tocIdx;
                    }

                    // MeshData
                    function ReadDataBlock(ti, buffer) {
                        try {
                            var m_StreamCurrentPosition = ti.position;
                            var view;
                            if (buffer === undefined) {
                                view = new DataView(result, m_StreamCurrentPosition, ti.datasize);
                                return view;
                            }
                            else {
                                view = new DataView(buffer, m_StreamCurrentPosition, ti.datasize);
                                return view;
                            }

                        } catch (e) {
                            return undefined;
                        }
                    }

                    //var ti = FindLast(3);
                    var ti = FindLast(ContentsType.CTMeshBlock);
                    var tocData = m_toc[ti];

                    //var view = ReadDataBlock(tocData);

                    //offset = 0;
                    //var meshBlockNum = view.getInt32(offset, true);
                    //offset += 4;

                    //var curload = 0;
                    //var loading = function () {
                    //    for (var i = curload; i < meshBlockNum; i++) {
                    //        var percent = curload / meshBlockNum;
                    //        if (percent === Infinity)
                    //            percent = 0;
                    //        //onProgress(1, percent);
                    //        console.log("ReadMeshBlock : " + i);
                    //        var cachTocIdx = 0;
                    //        cachTocIdx = view.getInt32(offset, true);
                    //        offset += 4;

                    //        //var tocIdx = FindToc(ContentsType.CTMeshBlockSub, cachTocIdx);//FindLast(22);
                    //        //toc = m_toc[tocIdx];
                    //        toc = m_toc[cachTocIdx];
                    //        //toc = FindTocItem(cachTocIdx);

                    //        var viewSub = ReadDataBlock(toc);

                    //        ImportMeshBlock(viewSub, cachTocIdx);
                    //        curload++;
                    //        if (curload !== meshBlockNum) {
                    //            setTimeout(function () {
                    //                onProgress(1, percent);
                    //                loading();
                    //            }, 25);
                    //            break;
                    //        }
                    //        else {
                    //            setTimeout(function () {
                    //                onProgress(1, 1);
                    //                result = null;

                    //                if (tocStructure === undefined) {
                    //                    setTimeout(function () {
                    //                        parseOnload(group, data);
                    //                    }, 25);
                    //                }
                    //                else {
                    //                    setTimeout(function () {
                    //                        ImportStructure(viewStructure, tocStructure);

                    //                        if (tocPropertyIndices === undefined) {
                    //                            setTimeout(function () {
                    //                                parseOnload(group, data);
                    //                            }, 25);
                    //                        }
                    //                        else {
                    //                            setTimeout(function () {
                    //                                LoadPropTableIndices(viewPropertyIndices, tocPropertyIndices);
                    //                            }, 25);
                    //                        }

                    //                    }, 25);
                    //                }
                    //            }, 25);
                    //        }
                    //    }
                    //};

                    //setTimeout(function () {
                    //    onProgress(1, 0);
                    //    loading();
                    //}, 25);
                    //var cntTriAll = 0;
                    function ImportMeshBlock(view, tiStruct) {
                        //var vnElemsSize = 15;
                        //var triElemsSize = 2 * 3;
                        var meshoffset = 0;
                        var MeshBlockSize;
                        MeshBlockSize = view.getInt32(meshoffset, true);
                        meshoffset += 4;

                        for (var i = 0; i < MeshBlockSize; i++) {
                            var color = {
                                R: view.getUint8(meshoffset, true),
                                G: view.getUint8(meshoffset + 1, true),
                                B: view.getUint8(meshoffset + 2, true),
                                A: view.getUint8(meshoffset + 3, true)
                            };
                            meshoffset += 4;
                            var nVtx = view.getUint32(meshoffset, true);
                            meshoffset += 4;
                            var nNormal = view.getUint32(meshoffset, true);
                            meshoffset += 4;
                            var nTri = view.getUint32(meshoffset, true);
                            meshoffset += 4;
                            //cntTriAll += nTri;
                            if (scope.Parse.parsetype === 1) {
                                var ptype = view.getUint32(meshoffset, true);
                                meshoffset += 4;
                            }

                            var cnt = nVtx / 15;
                            //var cntTri = nTri / 12;
                            //var buffpos = new Float32Array(cnt * 3);
                            //var buffnormal = new Float32Array(cnt * 3);
                            //var buffindex = [];//new Int32Array(cntTri * 3);

                            //var offsetV = meshoffset;

                            //var tmpdata = dataView.getFloat32(meshoffset + view.byteOffset, true);
                            var vtArray = new Float32Array(result, meshoffset + view.byteOffset, nVtx);

                            meshoffset += nVtx * 4;
                            //tmpdata = dataView.getUint16(meshoffset + view.byteOffset, true);
                            //var vnArray = new Uint16Array(result, meshoffset + view.byteOffset, nNormal);
                            //meshoffset += nNormal * 2;
                            var vnArray = new Float32Array(result, meshoffset + view.byteOffset, nNormal);
                            meshoffset += nNormal * 4;
                            //var triArray = new Uint16Array(result, meshoffset + view.byteOffset, nTri);
                            //meshoffset += nTri * 2;
                            var triArray = new Uint32Array(result, meshoffset + view.byteOffset, nTri);
                            meshoffset += nTri * 4;

                            //var info = {
                            //    fc: {
                            //        hasVertNormal: 1,
                            //        normalType: 0,
                            //        vertexType: 2,
                            //    }
                            //};

                            //function GetTypeSize(mtTypeId) {
                            //    var sz = 1;
                            //    return sz << mtTypeId;
                            //}

                            var geometry = new THREE.BufferGeometry();
                            geometry.setIndex(new THREE.Uint32BufferAttribute(triArray, 1));
                            geometry.addAttribute('position', new THREE.Float32BufferAttribute(vtArray, 3));
                            geometry.addAttribute('normal', new THREE.Float32BufferAttribute(vnArray, 3));

                            var count = vtArray.length / 3 * 4;
                            var colors = [];
                            for (var k = 0; k < count; k = k + 4) {

                                colors.push(color.R);
                                colors.push(color.G);
                                colors.push(color.B);
                                colors.push(color.A);
                            }
                            var colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
                            colorAttribute.normalized = true;
                            geometry.addAttribute('color', colorAttribute);

                            geometry.computeBoundingSphere();

                            var colorTmp = RGB2HEX(color.R, color.G, color.B);
                            //var material = new THREE.MeshPhongMaterial({
                            //    //color: colorTmp,
                            //    side: THREE.DoubleSide,
                            //    transparent: true,
                            //    //vertexColors: THREE.NoColors,
                            //    vertexColors: THREE.VertexColors,
                            //    opacity: color.A / 255,
                            //    shininess: 100,
                            //});

                            //var vEye = new THREE.Vector3(0.0, 0.0, 10.0).multiplyScalar(10000); //* 모델 반지름
                            //var vLight = new THREE.Vector3(200.0, 500.0, 1000.0).multiplyScalar(10000 * 300);// * 모델 반지름 * 300

                            //datamng.Shader.uniforms['vEye'].value = vEye;
                            //datamng.Shader.uniforms['vLight'].value = vLight;

                            //var material = new THREE.ShaderMaterial({//new THREE.RawShaderMaterial({
                            //    derivatives: datamng.Shader.derivatives,
                            //    uniforms: datamng.Shader.uniforms,
                            //    vertexShader: datamng.Shader.vertex,//document.getElementById('vertexShader').textContent,//datamng.Shader.vertex,
                            //    fragmentShader: datamng.Shader.fragment,//document.getElementById('fragmentShader').textContent,//datamng.Shader.fragment,
                            //    side: THREE.DoubleSide,
                            //    transparent: true,
                            //    flatShading: false,
                            //    clipping: true,
                            //    clippingPlanes: [],
                            //});

                            
                            mesh = new THREE.Mesh(geometry, datamng.Materials.basic);
                            //mesh = new THREE.Mesh(geometry, datamng.Materials.SSAO);
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;

                            object.add(mesh);

                            var MeshSize = view.getUint32(meshoffset, true);
                            meshoffset += 4;
                            var datas = [];
                            for (var j = 0; j < MeshSize; j++) {
                                var partid = view.getUint32(meshoffset, true);
                                meshoffset += 4;
                                var bodyid = view.getUint32(meshoffset, true);
                                meshoffset += 4;
                                var m_vnIdx = view.getUint32(meshoffset, true);
                                meshoffset += 4;
                                var m_triIdx = view.getUint32(meshoffset, true);
                                meshoffset += 4;

                                var MnVtx = view.getUint16(meshoffset, true);
                                meshoffset += 2;
                                var MnTri = view.getUint16(meshoffset, true);
                                meshoffset += 2;

                                var bbox = new Float32Array(view.buffer, meshoffset + view.byteOffset, 6);
                                meshoffset += 24;
                                if (bodyid === 90360)
                                    console.log("");
                                var data = {
                                    partId: partid + datamng.GetMaxID(),
                                    bodyId: bodyid + datamng.GetMaxID(),
                                    color: color,
                                    //m_vnIdx: m_vnIdx / 15 * 3,
                                    //m_triIdx: m_triIdx / 6 * 3,
                                    m_vnIdx: m_vnIdx * 3,
                                    m_triIdx: m_triIdx * 3,
                                    m_nVtx: MnVtx * 3,
                                    m_nTris: MnTri * 3,
                                    //m_nVtx: MnVtx,
                                    //m_nTris: MnTri,
                                    BBox: {
                                        min: {
                                            x: bbox[0],
                                            y: bbox[1],
                                            z: bbox[2]
                                        },
                                        max: {
                                            x: bbox[3],
                                            y: bbox[4],
                                            z: bbox[5]
                                        }
                                    },
                                    Tag: datamng.Tag()
                                    //mesh: mesh
                                };

                                datas.push(data);
                            }

                            mesh.userData = datas;
                        }
                    }

                    function ImportMeshBlock_body(view, tiStruct) {
                        var meshoffset = 0;
                        var MeshBlockSize;
                        MeshBlockSize = view.getInt32(meshoffset, true);
                        meshoffset += 4;

                        for (var i = 0; i < MeshBlockSize; i++) {
                            var color = {
                                R: view.getUint8(meshoffset, true),
                                G: view.getUint8(meshoffset + 1, true),
                                B: view.getUint8(meshoffset + 2, true),
                                A: view.getUint8(meshoffset + 3, true)
                            };
                            meshoffset += 4;
                            var nVtx = view.getUint32(meshoffset, true);
                            meshoffset += 4;
                            var nNormal = view.getUint32(meshoffset, true);
                            meshoffset += 4;
                            var nTri = view.getUint32(meshoffset, true);
                            meshoffset += 4;

                            if (scope.Parse.parsetype === 1) {
                                var ptype = view.getUint32(meshoffset, true);
                                meshoffset += 4;
                            }

                            var vtArray = new Float32Array(result, meshoffset + view.byteOffset, nVtx);
                            meshoffset += nVtx * 4;
                            var vnArray = new Float32Array(result, meshoffset + view.byteOffset, nNormal);
                            meshoffset += nNormal * 4;
                            var triArray = new Uint32Array(result, meshoffset + view.byteOffset, nTri);
                            meshoffset += nTri * 4;
                            
                            //var geometry = new THREE.BufferGeometry();
                            //geometry.setIndex(new THREE.Uint32BufferAttribute(triArray, 1));
                            //geometry.addAttribute('position', new THREE.Float32BufferAttribute(vtArray, 3));
                            //geometry.addAttribute('normal', new THREE.Float32BufferAttribute(vnArray, 3));

                            //var count = vtArray.length / 3 * 4;
                            //var colors = [];
                            //for (var k = 0; k < count; k = k + 4) {

                            //    colors.push(color.R);
                            //    colors.push(color.G);
                            //    colors.push(color.B);
                            //    colors.push(color.A);
                            //}
                            //var colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
                            //colorAttribute.normalized = true;
                            //geometry.addAttribute('color', colorAttribute);

                            //geometry.computeBoundingSphere();

                            //mesh = new THREE.Mesh(geometry, datamng.Materials.basic);
                            //mesh.castShadow = true;
                            //mesh.receiveShadow = true;

                            //object.add(mesh);

                            var MeshSize = view.getUint32(meshoffset, true);
                            meshoffset += 4;
                            //var datas = [];
                            for (var j = 0; j < MeshSize; j++) {
                                var datas = [];
                                var partid = view.getUint32(meshoffset, true);
                                meshoffset += 4;
                                var bodyid = view.getUint32(meshoffset, true);
                                if (bodyid === 90360)
                                    console.log("");
                                meshoffset += 4;
                                var m_vnIdx = view.getUint32(meshoffset, true);
                                meshoffset += 4;
                                var m_triIdx = view.getUint32(meshoffset, true);
                                meshoffset += 4;

                                var MnVtx = view.getUint16(meshoffset, true);
                                meshoffset += 2;
                                var MnTri = view.getUint16(meshoffset, true);
                                meshoffset += 2;

                                var bbox = new Float32Array(view.buffer, meshoffset + view.byteOffset, 6);
                                meshoffset += 24;

                                var data = {
                                    partId: partid + datamng.GetMaxID(),
                                    bodyId: bodyid + datamng.GetMaxID(),
                                    color: color,
                                    //m_vnIdx: m_vnIdx / 15 * 3,
                                    //m_triIdx: m_triIdx / 6 * 3,
                                    m_vnIdx: m_vnIdx * 3,
                                    m_triIdx: m_triIdx * 3,
                                    m_nVtx: MnVtx * 3,
                                    m_nTris: MnTri * 3,
                                    //m_nVtx: MnVtx,
                                    //m_nTris: MnTri,
                                    BBox: {
                                        min: {
                                            x: bbox[0],
                                            y: bbox[1],
                                            z: bbox[2]
                                        },
                                        max: {
                                            x: bbox[3],
                                            y: bbox[4],
                                            z: bbox[5]
                                        }
                                    },
                                    Tag: datamng.Tag()
                                    //mesh: mesh
                                };

                                // 데이터 추출
                                var indexes = triArray.slice(data.m_triIdx, data.m_triIdx + data.m_nTris);
                                
                                for (var idx = 0; idx < indexes.length; idx++) {
                                    indexes[idx] = indexes[idx] - data.m_vnIdx / 3;
                                }
                                var positions = vtArray.slice(data.m_vnIdx, data.m_vnIdx + data.m_nVtx);
                                var normals = vnArray.slice(data.m_vnIdx, data.m_vnIdx + data.m_nVtx);

                                data.m_triIdx = 0;
                                data.m_vnIdx = 0;

                                var geometry = new THREE.BufferGeometry();
                                geometry.setIndex(new THREE.Uint32BufferAttribute(indexes, 1));
                                geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                                geometry.addAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

                                var count = positions.length / 3 * 4;
                                var colors = [];
                                for (var k = 0; k < count; k = k + 4) {
                                    colors.push(color.R);
                                    colors.push(color.G);
                                    colors.push(color.B);
                                    colors.push(color.A);
                                }
                                var colorAttribute = new THREE.Uint8BufferAttribute(colors, 4);
                                colorAttribute.normalized = true;
                                geometry.addAttribute('color', colorAttribute);
                                geometry.computeBoundingSphere();

                                mesh = new THREE.Mesh(geometry, datamng.Materials.basic);
                                mesh.castShadow = true;
                                mesh.receiveShadow = true;

                                object.add(mesh);

                                datas.push(data);
                                mesh.userData = datas;
                            }

                            //mesh.userData = datas;
                        }
                    }

                    // tree
                    var tiStructure = FindLast(ContentsType.CTStructure);
                    var tocStructure = m_toc[tiStructure];
                    //if (tocStructure === undefined) {
                    //    setTimeout(function () {
                    //                    parseOnload(group, data);
                    //                }, 25);
                    //    return;
                    //}
                    var viewStructure = ReadDataBlock(tocStructure);
                    //setTimeout(function () { ImportStructure(viewStructure, tocStructure); }, 25);

                    function ImportStructure(view, toc) {
                        var offset = 0;
                        var m_Unit = view.getUint32(offset, true);
                        offset += 4;
                        var nEnts = view.getUint32(offset, true);
                        offset += 4;
                        var vdBlockSize = view.getUint32(offset, true);
                        offset += 4;

                        var m_vecPropHeaderDic = []; // 136 Byte
                        for (var i = 0; i < vdBlockSize; i++) {
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

                            var index = view.getUint32(offset, true);
                            HeaderTocTableItem.index = index === -1 ? index : index + datamng.GetMaxID();
                            offset += 4;
                            HeaderTocTableItem.type = view.getInt32(offset, true);
                            offset += 4;
                            HeaderTocTableItem.entFlags = view.getUint16(offset, true);
                            offset += 4;
                            HeaderTocTableItem.iNameIndex = view.getInt32(offset, true);
                            offset += 4;
                            HeaderTocTableItem.attFlags = view.getUint16(offset, true);
                            offset += 4;
                            HeaderTocTableItem.transfrom = [];
                            for (var j = 0; j < 16; j++) {
                                HeaderTocTableItem.transfrom[j] = view.getFloat32(offset, true);
                                offset += 4;
                            }
                            HeaderTocTableItem.bBox = [];
                            for (var k = 0; k < 6; k++) {
                                HeaderTocTableItem.bBox[k] = view.getFloat32(offset, true);
                                offset += 4;
                            }

                            HeaderTocTableItem.cCount = view.getInt32(offset, true);
                            offset += 4;
                            var pIndex = view.getInt32(offset, true);
                            HeaderTocTableItem.pIndex = pIndex === -1 ? pIndex : pIndex + datamng.GetMaxID();
                            offset += 4;
                            HeaderTocTableItem.orgNodeID = view.getInt32(offset, true);
                            offset += 4;
                            //byte * pNameBuff;
                            if (header.version < 302)
                                offset += 8;

                            HeaderTocTableItem.tocId = view.getInt32(offset, true); //Binary Block용 
                            offset += 4;
                            HeaderTocTableItem.btype = view.getInt32(offset, true);//Binary Block용 
                            offset += 4;

                            // add
                            if (HeaderTocTableItem.type !== ENTITY_TYPES.EntAssembly
                                && HeaderTocTableItem.type !== ENTITY_TYPES.EntPart
                                && HeaderTocTableItem.type !== ENTITY_TYPES.EntBody) {
                                nEnts--;
                                continue;
                            }

                            m_vecPropHeaderDic.push(HeaderTocTableItem);
                        }

                        datamng.AddNodes(m_vecPropHeaderDic);

                        // NodeName
                        var nNameNum = view.getInt32(offset, true);
                        offset += 4;
                        var decode_utf8 = function (s) {
                            return decodeURIComponent(escape(s));
                        };
                        var m_vecPropNodeNameDic = [];
                        var pos = 0;
                        for (var l = 0; l < nEnts; l++) {
                            if (m_vecPropHeaderDic[l].iNameIndex <= 0)
                                continue;

                            var NameTocTableItem = {
                                nStringNum: 0,
                                pos: 0,
                                name: null
                            };

                            NameTocTableItem.pos = pos;
                            NameTocTableItem.nStringNum = m_vecPropHeaderDic[l].iNameIndex;

                            var bodyNameBuffer = new Uint8Array(NameTocTableItem.nStringNum);
                            for (var m = 0; m < NameTocTableItem.nStringNum; m++) {
                                // Multibyte
                                //if(m%2 ===0)
                                //    bodyNameBuffer[m/2] = view.getUint8(pos + offset + m, true);
                                bodyNameBuffer[m] = view.getUint8(pos + offset + m, true);
                            }

                            bodyName = String.fromCharCode.apply(null, bodyNameBuffer);
                            try {
                                // UTF-8
                                bodyName = decode_utf8(bodyName);
                            } catch (e) {
                                console.log(e);
                            }

                            //[정규식 이용해서 gi 로 감싸기]
                            //감싼 따옴표를 슬래시로 대체하고 뒤에 gi 를 붙이면 
                            //replaceAll 과 같은 결과를 볼 수 있다.
                            //* g : 발생할 모든 pattern에 대한 전역 검색
                            //* i : 대 / 소문자 구분 안함
                            //* m: 여러 줄 검색(참고)

                            m_vecPropHeaderDic[l].name = bodyName.replace(/\0/gi,'');
                            NameTocTableItem.name = bodyName.replace(/\0/gi, '');
                            pos += m_vecPropHeaderDic[l].iNameIndex;
                            
                            m_vecPropNodeNameDic.push(NameTocTableItem);
                        }

                        offset += nNameNum;

                        var LoadProperty = function () {

                            // Property
                            var vdBodyBlockSize = view.getUint32(offset, true);
                            offset += 4;

                            for (var pb = 0; pb < vdBlockSize; pb++) {
                                var BodyTocTableItem = {
                                    nodeTreeOrderID: -1,
                                    hasColor: false,
                                    color: [],
                                    cacheidx: -1,
                                    hasLayerNumber: false,
                                    layerNum: -1,
                                    attrCount: -1,
                                    attrType: [],
                                    volume: 0,       //volume 
                                    area: 0,         //Area
                                    centroid: [],  //centroid (center of gravity)
                                    desbyteLength: -1,
                                    fdensity: -1,
                                    edgeStartidx: -1,
                                    edgeIdxNum: -1,
                                };
                                BodyTocTableItem.nodeTreeOrderID = view.getInt32(offset, true);
                                offset += 4;
                                BodyTocTableItem.hasColor = view.getUint8(offset, true);
                                offset += 4;
                                for (var i = 0; i < 4; i++) {
                                    BodyTocTableItem.color[i] = view.getFloat32(offset, true);
                                    offset += 4;
                                }
                                
                                BodyTocTableItem.cacheidx = view.getInt32(offset, true);
                                offset += 4;
                                BodyTocTableItem.hasLayerNumber = view.getUint8(offset, true);
                                offset += 4;
                                BodyTocTableItem.layerNum = view.getInt32(offset, true);
                                offset += 4;
                                BodyTocTableItem.attrCount = view.getInt32(offset, true);
                                offset += 4;
                                for (var i = 0; i < 2; i++) {
                                    BodyTocTableItem.attrType[i] = view.getInt32(offset, true);
                                    offset += 4;
                                }
                                BodyTocTableItem.volume = getUint64(view, offset, true);//view.getInt32(offset, true);
                                offset += 8;
                                BodyTocTableItem.area = getUint64(view, offset, true);//view.getInt32(offset, true);
                                offset += 8;
                                for (var i = 0; i < 3; i++) { //centroid (center of gravity)
                                    BodyTocTableItem.centroid[i] = getUint64(view, offset, true);//view.getInt32(offset, true);
                                    offset += 8;
                                }
                                BodyTocTableItem.desbyteLength = view.getInt32(offset, true);
                                offset += 4;
                                BodyTocTableItem.fdensity = view.getInt32(offset, true);
                                offset += 4;
                                BodyTocTableItem.edgeStartidx = view.getInt32(offset, true);
                                offset += 4;
                                BodyTocTableItem.edgeIdxNum = view.getInt32(offset, true);
                                offset += 4;
                            }
                        };

                        //LoadProperty();
                    }

                    // Property
                    var tiPropertyIndices = FindLast(ContentsType.CTNodePropTableIndices);
                    var tocPropertyIndices = m_toc[tiPropertyIndices];
                    //if (tocPropertyIndices === undefined) {
                    //    setTimeout(function () {
                    //        parseOnload(group, data);
                    //    }, 25);
                    //    return;
                    //}
                    var viewPropertyIndices = ReadDataBlock(tocPropertyIndices);
                    //setTimeout(function () { LoadPropTableIndices(viewPropertyIndices, tocPropertyIndices); }, 25);
                    function LoadPropTableIndices(view, toc) {
                        var offsetIndices = 0;
                        var nTables = view.getUint32(offsetIndices, true);
                        offsetIndices += 4;

                        var m_nodePropTables = [];

                        for (var p = 0; p < nTables; p++) {
                            var tidx = view.getUint32(offsetIndices, true);
                            offsetIndices += 4;

                            var PropTocTableItem = {
                                tableTocIdx: tidx,
                                nLoadedNodes: 0
                            };

                            m_nodePropTables.push(PropTocTableItem);
                        }

                        for (var pi = 0; pi < m_nodePropTables.length; pi++) {
                            var pti = m_nodePropTables[pi];
                            var tocProperty = m_toc[pti.tableTocIdx];
                            if (tocProperty === undefined) {
                                setTimeout(function () {
                                    parseOnload(group, data);
                                }, 25);
                                return;
                            }
                            else {
                                var viewProperty = ReadDataBlock(tocProperty, view.buffer);
                                LoadPropTableItem(viewProperty, tocProperty, pti);
                            }
                        }

                        function LoadPropTableItem(view, toc, pti) {
                            var offset = 0;
                            var nNodesPerTable = view.getUint32(offset, true);
                            offset += 4;
                            if (pti.nLoadedNodes === nNodesPerTable)
                                return false;
                            var arrProperty = [];
                            for (var i = 0; i < nNodesPerTable; i++) {
                                var Property = {
                                    nodeId: -1,
                                    nNodeProps: 0,
                                    items : []
                                };
                                arrProperty.push(Property);

                                Property.nodeId = view.getUint32(offset, true);
                                Property.nodeId += datamng.GetStartID();
                                offset += 4;
                                Property.nNodeProps = view.getInt16(offset, true);
                                offset += 2;

                                var encode_utf8 = function (s) {
                                    return unescape(encodeURIComponent(s));
                                };

                                var decode_utf8 = function (s) {
                                    return decodeURIComponent(escape(s));
                                };

                                for (var pi = 0; pi < Property.nNodeProps; pi++) {
                                    var item = {
                                        key: null,
                                        value: null,
                                        valueType: null
                                    };
                                    var len = view.getUint32(offset, true);
                                    offset += 4;

                                    var keyBuffer = new Uint8Array(len);
                                    for (var m = 0; m < len; m++) {
                                        keyBuffer[m] = view.getUint8(offset + m, true);
                                    }

                                    item.key = String.fromCharCode.apply(null, keyBuffer);
                                    try {
                                        item.key = decode_utf8(item.key);
                                        //item.key = decode_utf8(window.atob(item.key));
                                    } catch (e) {
                                    }
                                    
                                    offset += len;

                                    len = view.getUint16(offset, true);
                                    offset += 2;

                                    len = view.getUint32(offset, true);
                                    offset += 4;

                                    var valueBuffer = new Uint8Array(len);
                                    for (var m = 0; m < len; m++) {
                                        valueBuffer[m] = view.getUint8(offset + m, true);
                                    }
                                    item.value = String.fromCharCode.apply(null, valueBuffer);
                                    try {
                                        item.value = decode_utf8(item.value);
                                        //item.value = decode_utf8(window.atob(item.value));
                                    } catch (e) {
                                    }
                                    
                                    offset += len;

                                    item.valType = view.getUint16(offset, true);
                                    offset += 2;

                                    Property.items.push(item);
                                }
                            }

                            datamng.AddUserProperty(arrProperty);

                            // ID 재조정
                            datamng.ResetID();

                            setTimeout(function () {
                                parseOnload(group, data);
                            }, 25);
                        }
                    }

                    if (tocData === undefined) {
                        onProgress(1, 1);
                        result = null;

                        if (tocStructure === undefined) {
                            setTimeout(function () {
                                parseOnload(group, data);
                            }, 25);
                        }
                        else {
                            setTimeout(function () {
                                ImportStructure(viewStructure, tocStructure);

                                if (tocPropertyIndices === undefined) {
                                    setTimeout(function () {
                                        parseOnload(group, data);
                                    }, 25);
                                }
                                else {
                                    setTimeout(function () {
                                        LoadPropTableIndices(viewPropertyIndices, tocPropertyIndices);
                                    }, 25);
                                }

                            }, 25);
                        }
                    }
                    else {
                        var view = ReadDataBlock(tocData);

                        offset = 0;
                        var meshBlockNum = view.getInt32(offset, true);
                        offset += 4;

                        var curload = 0;
                        var loading = function () {
                            for (var i = curload; i < meshBlockNum; i++) {
                                var percent = curload / meshBlockNum;
                                if (percent === Infinity)
                                    percent = 0;
                                //onProgress(1, percent);
                                console.log("ReadMeshBlock : " + i);
                                var cachTocIdx = 0;
                                cachTocIdx = view.getInt32(offset, true);
                                offset += 4;

                                //var tocIdx = FindToc(ContentsType.CTMeshBlockSub, cachTocIdx);//FindLast(22);
                                //toc = m_toc[tocIdx];
                                toc = m_toc[cachTocIdx];
                                //toc = FindTocItem(cachTocIdx);

                                var viewSub = ReadDataBlock(toc);

                                ImportMeshBlock(viewSub, cachTocIdx);
                                //ImportMeshBlock_body(viewSub, cachTocIdx);
                                curload++;
                                if (curload !== meshBlockNum) {
                                    setTimeout(function () {
                                        onProgress(1, percent);
                                        loading();
                                    }, 25);
                                    break;
                                }
                                else {
                                    setTimeout(function () {
                                        onProgress(1, 1);
                                        result = null;

                                        if (tocStructure === undefined) {
                                            setTimeout(function () {
                                                parseOnload(group, data);
                                            }, 25);
                                        }
                                        else {
                                            setTimeout(function () {
                                                ImportStructure(viewStructure, tocStructure);

                                                if (tocPropertyIndices === undefined) {
                                                    setTimeout(function () {
                                                        parseOnload(group, data);
                                                    }, 25);
                                                }
                                                else {
                                                    setTimeout(function () {
                                                        LoadPropTableIndices(viewPropertyIndices, tocPropertyIndices);
                                                    }, 25);
                                                }

                                            }, 25);
                                        }
                                    }, 25);
                                }
                            }
                        };

                        setTimeout(function () {
                            onProgress(1, 0);
                            loading();
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
                        //xhrFields: {  //response 데이터를 바이너리로 처리한다.
                        //    //dataType: 'binary'
                        //    //responseType: 'arraybuffer'
                        //    //responseType: 'blob'
                        //},
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
                function down_Zip() {
                    //let zip_url = 'http://localhost/a.zip';
                    //let zip_url = 'http://localhost/VIZWeb3D/VIZWeb3D/MODEL/300p_desk_chair_assy_v303_ul_noEdge.zip';
                    //let zip_url = 'http://localhost/VIZWeb3D/VIZWeb3D/MODEL/300p_desk_chair_assy_v303_ul_nohide.zip';
                    //let zip_url = 'http://localhost/VIZWeb3D/VIZWeb3D/MODEL/900p_desk_chair_assy_v303_ul_nohide.zip';
                    onProgress(0, 0, 0, 0);
                    let promise = new JSZip.external.Promise(function (resolve, reject) {
                        JSZipUtils.getBinaryContent(zip_url, function (err, data) {
                            if (err) {
                                reject(err);
                            } else {
                                console.log("File Downloading Finish");
                                resolve(data);
                            }
                        });
                    });
                    promise.then(JSZip.loadAsync).then(
                        function (zip) {
                            console.log("File Uncompress Start");
                            zip.forEach(function (fileName) {
                                let file = zip.file(fileName);
                                // 압축 파일 안에 저장된 파일이 압축이 풀리고 ArrayBuffer 타입으로 전달됨
                                file.async("arraybuffer", function updateCallback(metadata){
                                    console.log("progression: " + metadata.percent.toFixed(0) + " %");
                                    var percent = metadata.percent.toFixed(2) / 100;
                                    onProgress(0, percent, percent, 100);

                                }).then(
                                    function success(buf) {
                                        //alert(fileName);
                                        console.log("File Uncompress Finish");
                                        asyncParse(buf);
                                        //result.slice(0, result.length);
                                        result = null;
                                    },
                                    function error(e) {
                                        // 에러가 나셨습니다.
                                        alert("error");
                                    }
                                );
                            });
                        }
                    );
                }
                //if (browser.Name.localeCompare("Chrome") === 0)
                if (browser.Type === BROWSER_TYPES.Edge
                    || browser.Type === BROWSER_TYPES.Internet_Explorer)
                    down_Edge();
                else
                    down();//down_Zip();//down();

            },
        };

        return VIZWLoader;
    }
);