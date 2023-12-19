import EventDispatcher from "./EventDispatcher.js";
import Enum from "./Enum.js";

(function () {
    'use strict';
    if (typeof Object.assign !== 'function') {
        // Must be writable: true, enumerable: false, configurable: true
        Object.defineProperty(Object, "assign", {
            value: function assign(target, varArgs) { // .length of function is 2
                'use strict';
                if (target === null) { // TypeError if undefined or null
                    throw new TypeError('Cannot convert undefined or null to object');
                }

                let to = Object(target);

                for (let index = 1; index < arguments.length; index++) {
                    let nextSource = arguments[index];

                    if (nextSource != null) { // Skip over if undefined or null
                        for (let nextKey in nextSource) {
                            // Avoid bugs when hasOwnProperty is shadowed
                            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                to[nextKey] = nextSource[nextKey];
                            }
                        }
                    }
                }
                return to;
            },
            writable: true,
            configurable: true
        });
    }
}());

(function () {
    'use strict';
    let _sliceUint = Uint32Array.prototype.slice;

    try {
        _sliceUint.call(document.documentElement);
    } catch (e) { // Fails in IE
        Uint32Array.prototype.slice = function (begin, end) {
            end = (typeof end !== 'undefined') ? end : this.length;
            // 네이티브 Array 객체의 경우 네이티브 slice 함수를 사용합니다.
            if (Object.prototype.toString.call(this) === '[object Array]') {
                return _sliceUint.call(this, begin, end);
            }

            // object와 같은 배열을 위해 우리는 스스로 처리한다.
            let i, cloned = [],
                size, len = this.length;

            // "begin"에 대한 음수 값을 처리합니다.
            let start = begin || 0;
            start = (start >= 0) ? start : Math.max(0, len + start);

            // "end"에 대한 음수 값을 처리합니다.
            let upTo = (typeof end === 'number') ? Math.min(end, len) : len;
            if (end < 0) {
                upTo = len + end;
            }
            // 슬라이스의 실제 예상 크기
            size = upTo - start;
            if (size > 0) {
                cloned = new Array(size);
                if (this.charAt) {
                    for (i = 0; i < size; i++) {
                        cloned[i] = this.charAt(start + i);
                    }
                } else {
                    for (i = 0; i < size; i++) {
                        cloned[i] = this[start + i];
                    }
                }
            }
            return cloned;
        };
    }

    let _sliceFloat = Float32Array.prototype.slice;

    try {
        _sliceFloat.call(document.documentElement);
    } catch (e) { // Fails in IE
        Float32Array.prototype.slice = function (begin, end) {
            end = (typeof end !== 'undefined') ? end : this.length;
            // 네이티브 Array 객체의 경우 네이티브 slice 함수를 사용합니다.
            if (Object.prototype.toString.call(this) === '[object Array]') {
                return _sliceFloat.call(this, begin, end);
            }

            // object와 같은 배열을 위해 우리는 스스로 처리한다.
            let i, cloned = [],
                size, len = this.length;

            // "begin"에 대한 음수 값을 처리합니다.
            let start = begin || 0;
            start = (start >= 0) ? start : Math.max(0, len + start);

            // "end"에 대한 음수 값을 처리합니다.
            let upTo = (typeof end === 'number') ? Math.min(end, len) : len;
            if (end < 0) {
                upTo = len + end;
            }
            // 슬라이스의 실제 예상 크기
            size = upTo - start;
            if (size > 0) {
                cloned = new Array(size);
                if (this.charAt) {
                    for (i = 0; i < size; i++) {
                        cloned[i] = this.charAt(start + i);
                    }
                } else {
                    for (i = 0; i < size; i++) {
                        cloned[i] = this[start + i];
                    }
                }
            }
            return cloned;
        };
    }
}());

//let VIZCore = VIZCore || {};
let VIZCore = function(){};

VIZCore.namespace = function (ns_string) {
    let parts = ns_string.split('.'), parent = VIZCore, i;
    // 처음에 중복되는 전역 객체명은 제거한다. 
    if (parts[0] === 'VIZCore') { parts = parts.slice(1); }
    for (i = 0; i < parts.length; i += 1) {
        if (typeof parent[parts[i]] === 'undefined') {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }
    return parent;
};

new Enum(VIZCore);

VIZCore.namespace("VIZCore.Color");
VIZCore.Color = function (r, g, b, a) {

    this.r = r || 0;
    this.g = g || 0;
    this.b = b || 0;
    this.a = a || 255;

};

Object.assign(VIZCore.Color.prototype, {
    set: function (r, g, b, a) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    },

    //rgba ID 버전
    //new: function () {
    //    let offset = 1;
    //
    //    if (this.a + offset <= 255) {
    //        this.a += offset;
    //    }
    //    else if (this.b + offset <= 255) {
    //        this.b += offset;
    //        this.a = 0;
    //    }
    //    else if (this.g + offset <= 255) {
    //        this.g += offset;
    //        this.b = 0;
    //        this.a = 0;
    //    }
    //    else {
    //        this.r += offset;
    //        this.g = 0;
    //        this.b = 0;
    //        this.a = 0;
    //    }
    //
    //    return this;
    //},

    //rgb ID
    new: function () {
        let offset = 1;

        if (this.b + offset <= 255) {
            this.b += offset;
        }
        else if (this.g + offset <= 255) {
            this.g += offset;
            this.b = 0;
        }
        else {
            this.r += offset;
            this.g = 0;
            this.b = 0;
        }

        return this;
    },

    copy: function (c) {
        this.r = c.r;
        this.g = c.g;
        this.b = c.b;
        this.a = c.a;

        return this;
    },

    equals: function (c) {
        return ((c.r === this.r) && (c.g === this.g) && (c.b === this.b) && (c.a === this.a));
    },

    glColor: function () {
        //let color = new Color();
        return function glColor() {
            let color = new VIZCore.Color();
            color.set(this.r, this.g, this.b, this.a);
            color.r /= 255;
            color.g /= 255;
            color.b /= 255;
            color.a /= 255;
            return color;
        };
    }(),

    glAlpha: function () {
        return this.a / 255;
    },

    setGLColor: function (r, g, b, a) {
        this.r = Math.floor(r * 255);
        this.g = Math.floor(g * 255);
        this.b = Math.floor(b * 255);
        this.a = Math.floor(a * 255);

        return this;
    },

    setHex: function (hex) {
        if (hex.slice(0, 1).localeCompare("#") !== 0) return;

        if (hex.length < 8) {
            //RGB
            //#FFFFFF
            this.r = parseInt(hex.slice(1, 3), 16);
            this.g = parseInt(hex.slice(3, 5), 16);
            this.b = parseInt(hex.slice(5, 7), 16);
        }
        else {
            //ARGB
            //#80FFFFFF
            this.a = parseInt(hex.slice(1, 3), 16);
            this.r = parseInt(hex.slice(3, 5), 16);
            this.g = parseInt(hex.slice(5, 7), 16);
            this.b = parseInt(hex.slice(7, 9), 16);
            
        }
		return this;
    },

    toHexARGB : function() {
        let r = this.r.toString(16).toUpperCase();
        let g = this.g.toString(16).toUpperCase();
        let b = this.b.toString(16).toUpperCase();
        let a = this.a.toString(16).toUpperCase();
      
        if (r.length == 1)
          r = "0" + r;
        if (g.length == 1)
          g = "0" + g;
        if (b.length == 1)
          b = "0" + b;
        if (a.length == 1)
          a = "0" + a;
      
        return "#" + a + r + g + b;
    },

    toHexA : function() {
        let r = this.r.toString(16).toUpperCase();
        let g = this.g.toString(16).toUpperCase();
        let b = this.b.toString(16).toUpperCase();
        let a = this.a.toString(16).toUpperCase();
      
        if (r.length == 1)
          r = "0" + r;
        if (g.length == 1)
          g = "0" + g;
        if (b.length == 1)
          b = "0" + b;
        if (a.length == 1)
          a = "0" + a;
      
        return "#" + r + g + b + a;
    },
    
    multiplyScalar: function(scalar) {
        this.r = c1.r * scalar;
        this.g = c1.g * scalar;
        this.b = c1.b * scalar;
        this.a = c1.a * scalar;
        return this;
    },

    multiplyColors: function(c1, c2) {
        this.r = c1.r * c2.r;
        this.g = c1.g * c2.g;
        this.b = c1.b * c2.b;
        this.a = c1.a * c2.a;
        return this;
    }
    
});

VIZCore.namespace("VIZCore.Vector3");

VIZCore.Vector3 = function (x, y, z) {

    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;

};

Object.assign(VIZCore.Vector3.prototype, {

    isVector3: true,

    set: function (x, y, z) {

        this.x = x;
        this.y = y;
        this.z = z;

        return this;

    },

    setScalar: function (scalar) {

        this.x = scalar;
        this.y = scalar;
        this.z = scalar;

        return this;

    },

    setX: function (x) {

        this.x = x;

        return this;

    },

    setY: function (y) {

        this.y = y;

        return this;

    },

    setZ: function (z) {

        this.z = z;

        return this;

    },

    setComponent: function (index, value) {

        switch (index) {

            case 0: this.x = value; break;
            case 1: this.y = value; break;
            case 2: this.z = value; break;
            default: throw new Error('index is out of range: ' + index);

        }

        return this;

    },

    getComponent: function (index) {

        switch (index) {

            case 0: return this.x;
            case 1: return this.y;
            case 2: return this.z;
            default: throw new Error('index is out of range: ' + index);

        }

    },

    clone: function () {

        return new this.constructor(this.x, this.y, this.z);

    },

    copy: function (v) {

        this.x = v.x;
        this.y = v.y;
        this.z = v.z;

        return this;

    },

    add: function (v, w) {

        if (w !== undefined) {

            console.warn('THREE.Vector3: .add() now only accepts one argument. Use .addVectors( a, b ) instead.');
            return this.addVectors(v, w);

        }

        this.x += v.x;
        this.y += v.y;
        this.z += v.z;

        return this;

    },

    addScalar: function (s) {

        this.x += s;
        this.y += s;
        this.z += s;

        return this;

    },

    addVectors: function (a, b) {

        this.x = a.x + b.x;
        this.y = a.y + b.y;
        this.z = a.z + b.z;

        return this;

    },

    addScaledVector: function (v, s) {

        this.x += v.x * s;
        this.y += v.y * s;
        this.z += v.z * s;

        return this;

    },

    sub: function (v, w) {

        if (w !== undefined) {

            console.warn('THREE.Vector3: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.');
            return this.subVectors(v, w);

        }

        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;

        return this;

    },

    subScalar: function (s) {

        this.x -= s;
        this.y -= s;
        this.z -= s;

        return this;

    },

    subVectors: function (a, b) {

        this.x = a.x - b.x;
        this.y = a.y - b.y;
        this.z = a.z - b.z;

        return this;

    },

    multiply: function (v, w) {

        if (w !== undefined) {

            console.warn('THREE.Vector3: .multiply() now only accepts one argument. Use .multiplyVectors( a, b ) instead.');
            return this.multiplyVectors(v, w);

        }

        this.x *= v.x;
        this.y *= v.y;
        this.z *= v.z;

        return this;

    },

    multiplyScalar: function (scalar) {

        this.x *= scalar;
        this.y *= scalar;
        this.z *= scalar;

        return this;

    },

    multiplyVectors: function (a, b) {

        this.x = a.x * b.x;
        this.y = a.y * b.y;
        this.z = a.z * b.z;

        return this;

    },

    applyEuler: function () {

        //let quaternion = new Quaternion();

        //return function applyEuler(euler) {

        //    if (!(euler && euler.isEuler)) {

        //        console.error('THREE.Vector3: .applyEuler() now expects an Euler rotation rather than a Vector3 and order.');

        //    }

        //    return this.applyQuaternion(quaternion.setFromEuler(euler));

        //};

    }(),

    applyAxisAngle: function () {

        //let quaternion = new Quaternion();

        //return function applyAxisAngle(axis, angle) {

        //    return this.applyQuaternion(quaternion.setFromAxisAngle(axis, angle));

        //};

    }(),

    applyMatrix3: function (m) {

        let x = this.x, y = this.y, z = this.z;
        let e = m.elements;

        this.x = e[0] * x + e[3] * y + e[6] * z;
        this.y = e[1] * x + e[4] * y + e[7] * z;
        this.z = e[2] * x + e[5] * y + e[8] * z;

        return this;

    },

    applyMatrix4: function (m, n) {
        if (n === undefined) {
            let x = this.x, y = this.y, z = this.z;
            let e = m.elements;

            let w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15]);

            this.x = (e[0] * x + e[4] * y + e[8] * z + e[12]) * w;
            this.y = (e[1] * x + e[5] * y + e[9] * z + e[13]) * w;
            this.z = (e[2] * x + e[6] * y + e[10] * z + e[14]) * w;

            return this;
        }
        else {

        }
    },

    applyQuaternion: function (q) {

        let x = this.x, y = this.y, z = this.z;
        let qx = q.x, qy = q.y, qz = q.z, qw = q.w;

        // calculate quat * vector

        let ix = qw * x + qy * z - qz * y;
        let iy = qw * y + qz * x - qx * z;
        let iz = qw * z + qx * y - qy * x;
        let iw = - qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
        this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
        this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

        return this;

    },

    project: function (camera) {

        return this.applyMatrix4(camera.matrixWorldInverse).applyMatrix4(camera.projectionMatrix);

    },

    unproject: function () {

        //let matrix = new VIZCore.Matrix4();

        //return function unproject(camera) {

        //    return this.applyMatrix4(matrix.getInverse(camera.projectionMatrix)).applyMatrix4(camera.matrixWorld);

        //};

    }(),

    transformDirection: function (m) {

        // input: THREE.Matrix4 affine matrix
        // vector interpreted as a direction

        let x = this.x, y = this.y, z = this.z;
        let e = m.elements;

        this.x = e[0] * x + e[4] * y + e[8] * z;
        this.y = e[1] * x + e[5] * y + e[9] * z;
        this.z = e[2] * x + e[6] * y + e[10] * z;

        return this.normalize();

    },

    divide: function (v) {

        this.x /= v.x;
        this.y /= v.y;
        this.z /= v.z;

        return this;

    },

    divideScalar: function (scalar) {

        return this.multiplyScalar(1 / scalar);

    },

    min: function (v) {

        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);
        this.z = Math.min(this.z, v.z);

        return this;

    },

    max: function (v) {

        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);
        this.z = Math.max(this.z, v.z);

        return this;

    },

    clamp: function (min, max) {

        // assumes min < max, componentwise

        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));
        this.z = Math.max(min.z, Math.min(max.z, this.z));

        return this;

    },

    clampScalar: function () {

        let min = new VIZCore.Vector3();
        let max = new VIZCore.Vector3();

        return function clampScalar(minVal, maxVal) {

            min.set(minVal, minVal, minVal);
            max.set(maxVal, maxVal, maxVal);

            return this.clamp(min, max);

        };

    }(),

    clampLength: function (min, max) {

        let length = this.length();

        return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));

    },

    floor: function () {

        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        this.z = Math.floor(this.z);

        return this;

    },

    ceil: function () {

        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);
        this.z = Math.ceil(this.z);

        return this;

    },

    round: function () {

        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.z = Math.round(this.z);

        return this;

    },

    roundToZero: function () {

        this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x);
        this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y);
        this.z = (this.z < 0) ? Math.ceil(this.z) : Math.floor(this.z);

        return this;

    },

    negate: function () {

        this.x = - this.x;
        this.y = - this.y;
        this.z = - this.z;

        return this;

    },

    dot: function (v) {

        return this.x * v.x + this.y * v.y + this.z * v.z;

    },

    // TODO lengthSquared?

    lengthSq: function () {

        return this.x * this.x + this.y * this.y + this.z * this.z;

    },

    length: function () {

        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);

    },

    length2D: function () {

        return Math.sqrt(this.x * this.x + this.y * this.y);

    },

    manhattanLength: function () {

        return Math.abs(this.x) + Math.abs(this.y) + Math.abs(this.z);

    },

    normalize: function () {

        return this.divideScalar(this.length() || 1);

    },

    setLength: function (length) {

        return this.normalize().multiplyScalar(length);

    },

    lerp: function (v, alpha) {

        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;
        this.z += (v.z - this.z) * alpha;

        return this;

    },

    lerpVectors: function (v1, v2, alpha) {

        return this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);

    },

    cross: function (v, w) {

        if (w !== undefined) {

            console.warn('THREE.Vector3: .cross() now only accepts one argument. Use .crossVectors( a, b ) instead.');
            return this.crossVectors(v, w);

        }

        return this.crossVectors(this, v);

    },

    crossVectors: function (a, b) {

        let ax = a.x, ay = a.y, az = a.z;
        let bx = b.x, by = b.y, bz = b.z;

        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;

        return this;

    },

    projectOnVector: function (vector) {

        let scalar = vector.dot(this) / vector.lengthSq();

        return this.copy(vector).multiplyScalar(scalar);

    },

    projectOnPlane: function () {

        let v1 = new VIZCore.Vector3();

        return function projectOnPlane(planeNormal) {

            v1.copy(this).projectOnVector(planeNormal);

            return this.sub(v1);

        };

    }(),

    reflect: function () {

        // reflect incident vector off plane orthogonal to normal
        // normal is assumed to have unit length

        let v1 = new VIZCore.Vector3();

        return function reflect(normal) {

            return this.sub(v1.copy(normal).multiplyScalar(2 * this.dot(normal)));

        };

    }(),

    angleTo: function (v) {

        let theta = this.dot(v) / (Math.sqrt(this.lengthSq() * v.lengthSq()));

        // clamp, to handle numerical problems

        return Math.acos(Math.clamp(theta, - 1, 1));

    },

    distanceTo: function (v) {

        return Math.sqrt(this.distanceToSquared(v));

    },

    distanceToSquared: function (v) {

        let dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

        return dx * dx + dy * dy + dz * dz;

    },

    manhattanDistanceTo: function (v) {

        return Math.abs(this.x - v.x) + Math.abs(this.y - v.y) + Math.abs(this.z - v.z);

    },

    setFromSpherical: function (s) {

        return this.setFromSphericalCoords(s.radius, s.phi, s.theta);

    },

    setFromSphericalCoords: function (radius, phi, theta) {

        let sinPhiRadius = Math.sin(phi) * radius;

        this.x = sinPhiRadius * Math.sin(theta);
        this.y = Math.cos(phi) * radius;
        this.z = sinPhiRadius * Math.cos(theta);

        return this;

    },

    setFromCylindrical: function (c) {

        return this.setFromCylindricalCoords(c.radius, c.theta, c.y);

    },

    setFromCylindricalCoords: function (radius, theta, y) {

        this.x = radius * Math.sin(theta);
        this.y = y;
        this.z = radius * Math.cos(theta);

        return this;

    },

    setFromMatrixPosition: function (m) {

        let e = m.elements;

        this.x = e[12];
        this.y = e[13];
        this.z = e[14];

        return this;

    },

    setFromMatrixScale: function (m) {

        let sx = this.setFromMatrixColumn(m, 0).length();
        let sy = this.setFromMatrixColumn(m, 1).length();
        let sz = this.setFromMatrixColumn(m, 2).length();

        this.x = sx;
        this.y = sy;
        this.z = sz;

        return this;

    },

    setFromMatrixColumn: function (m, index) {

        return this.fromArray(m.elements, index * 4);

    },

    equals: function (v) {

        return ((v.x === this.x) && (v.y === this.y) && (v.z === this.z));

    },

    fromArray: function (array, offset) {

        if (offset === undefined) offset = 0;

        this.x = array[offset];
        this.y = array[offset + 1];
        this.z = array[offset + 2];

        return this;

    },

    toArray: function (array, offset) {

        if (array === undefined) array = [];
        if (offset === undefined) offset = 0;

        array[offset] = this.x;
        array[offset + 1] = this.y;
        array[offset + 2] = this.z;

        return array;

    },

    fromBufferAttribute: function (attribute, index, offset) {

        if (offset !== undefined) {

            console.warn('THREE.Vector3: offset has been removed from .fromBufferAttribute().');

        }

        this.x = attribute.getX(index);
        this.y = attribute.getY(index);
        this.z = attribute.getZ(index);

        return this;

    },

    get2DAngle: function () {
        let vec = new VIZCore.Vector3().copy(this);
        vec.normalize();

        let angle = Math.acos(vec.x);
        if (vec.y < 0) {
            angle = 3.141592654 * 2.0 - angle;
        }
        return angle;
    },


});

//#endregion VIZCore Vector3

//#region VIZCore Matrix4
VIZCore.namespace("VIZCore.Matrix4");
VIZCore.Matrix4 = function () {

    this.elements = [

        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1

    ];

    if (arguments.length > 0) {

        console.error('THREE.Matrix4: the constructor no longer reads arguments. use .set() instead.');

    }
};

Object.assign(VIZCore.Matrix4.prototype, {

    isMatrix4: true,

    set: function (n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {

        let te = this.elements;

        te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
        te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
        te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
        te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;

        return this;

    },
    set2: function (n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44) {

        let te = this.elements;

        te[0] = n11; te[4] = n21; te[8] = n31; te[12] = n41;
        te[1] = n12; te[5] = n22; te[9] = n32; te[13] = n42;
        te[2] = n13; te[6] = n23; te[10] = n33; te[14] = n43;
        te[3] = n14; te[7] = n24; te[11] = n34; te[15] = n44;

        return this;

    },

    setArray: function (arr) {

        let te = this.elements;

        for(let i = 0 ; i < 16 ; i++)
            te[i] = arr[i];
        return this;
    },

    identity: function () {

        this.set(

            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1

        );

        return this;

    },

    clone: function () {

        return new VIZCore.Matrix4().fromArray(this.elements);

    },

    copy: function (m) {

        let te = this.elements;
        let me = m.elements;

        te[0] = me[0]; te[1] = me[1]; te[2] = me[2]; te[3] = me[3];
        te[4] = me[4]; te[5] = me[5]; te[6] = me[6]; te[7] = me[7];
        te[8] = me[8]; te[9] = me[9]; te[10] = me[10]; te[11] = me[11];
        te[12] = me[12]; te[13] = me[13]; te[14] = me[14]; te[15] = me[15];

        return this;

    },

    copyPosition: function (m) {

        let te = this.elements, me = m.elements;

        te[12] = me[12];
        te[13] = me[13];
        te[14] = me[14];

        return this;

    },

    extractBasis: function (xAxis, yAxis, zAxis) {

        xAxis.setFromMatrixColumn(this, 0);
        yAxis.setFromMatrixColumn(this, 1);
        zAxis.setFromMatrixColumn(this, 2);

        return this;

    },

    makeBasis: function (xAxis, yAxis, zAxis) {

        this.set(
            xAxis.x, yAxis.x, zAxis.x, 0,
            xAxis.y, yAxis.y, zAxis.y, 0,
            xAxis.z, yAxis.z, zAxis.z, 0,
            0, 0, 0, 1
        );

        return this;

    },

    extractRotation: function () {

        let v1 = new VIZCore.Vector3();

        return function extractRotation(m) {

            // this method does not support reflection matrices

            let te = this.elements;
            let me = m.elements;

            let scaleX = 1 / v1.setFromMatrixColumn(m, 0).length();
            let scaleY = 1 / v1.setFromMatrixColumn(m, 1).length();
            let scaleZ = 1 / v1.setFromMatrixColumn(m, 2).length();

            te[0] = me[0] * scaleX;
            te[1] = me[1] * scaleX;
            te[2] = me[2] * scaleX;
            te[3] = 0;

            te[4] = me[4] * scaleY;
            te[5] = me[5] * scaleY;
            te[6] = me[6] * scaleY;
            te[7] = 0;

            te[8] = me[8] * scaleZ;
            te[9] = me[9] * scaleZ;
            te[10] = me[10] * scaleZ;
            te[11] = 0;

            te[12] = 0;
            te[13] = 0;
            te[14] = 0;
            te[15] = 1;

            return this;

        };

    }(),

    makeRotationFromEuler: function (euler) {

        if (!(euler && euler.isEuler)) {

            console.error('THREE.Matrix4: .makeRotationFromEuler() now expects a Euler rotation rather than a Vector3 and order.');

        }

        let te = this.elements;

        let x = euler.x, y = euler.y, z = euler.z;
        let a = Math.cos(x), b = Math.sin(x);
        let c = Math.cos(y), d = Math.sin(y);
        let e = Math.cos(z), f = Math.sin(z);

        if (euler.order === 'XYZ') {

            let ae = a * e, af = a * f, be = b * e, bf = b * f;

            te[0] = c * e;
            te[4] = - c * f;
            te[8] = d;

            te[1] = af + be * d;
            te[5] = ae - bf * d;
            te[9] = - b * c;

            te[2] = bf - ae * d;
            te[6] = be + af * d;
            te[10] = a * c;

        } else if (euler.order === 'YXZ') {

            let ce = c * e, cf = c * f, de = d * e, df = d * f;

            te[0] = ce + df * b;
            te[4] = de * b - cf;
            te[8] = a * d;

            te[1] = a * f;
            te[5] = a * e;
            te[9] = - b;

            te[2] = cf * b - de;
            te[6] = df + ce * b;
            te[10] = a * c;

        } else if (euler.order === 'ZXY') {

            let ce = c * e, cf = c * f, de = d * e, df = d * f;

            te[0] = ce - df * b;
            te[4] = - a * f;
            te[8] = de + cf * b;

            te[1] = cf + de * b;
            te[5] = a * e;
            te[9] = df - ce * b;

            te[2] = - a * d;
            te[6] = b;
            te[10] = a * c;

        } else if (euler.order === 'ZYX') {

            let ae = a * e, af = a * f, be = b * e, bf = b * f;

            te[0] = c * e;
            te[4] = be * d - af;
            te[8] = ae * d + bf;

            te[1] = c * f;
            te[5] = bf * d + ae;
            te[9] = af * d - be;

            te[2] = - d;
            te[6] = b * c;
            te[10] = a * c;

        } else if (euler.order === 'YZX') {

            let ac = a * c, ad = a * d, bc = b * c, bd = b * d;

            te[0] = c * e;
            te[4] = bd - ac * f;
            te[8] = bc * f + ad;

            te[1] = f;
            te[5] = a * e;
            te[9] = - b * e;

            te[2] = - d * e;
            te[6] = ad * f + bc;
            te[10] = ac - bd * f;

        } else if (euler.order === 'XZY') {

            let ac = a * c, ad = a * d, bc = b * c, bd = b * d;

            te[0] = c * e;
            te[4] = - f;
            te[8] = d * e;

            te[1] = ac * f + bd;
            te[5] = a * e;
            te[9] = ad * f - bc;

            te[2] = bc * f - ad;
            te[6] = b * e;
            te[10] = bd * f + ac;

        }

        // bottom row
        te[3] = 0;
        te[7] = 0;
        te[11] = 0;

        // last column
        te[12] = 0;
        te[13] = 0;
        te[14] = 0;
        te[15] = 1;

        return this;

    },

    makeRotationFromQuaternion: function () {

        let zero = new VIZCore.Vector3(0, 0, 0);
        let one = new VIZCore.Vector3(1, 1, 1);

        return function makeRotationFromQuaternion(q) {

            return this.compose(zero, q, one);

        };

    }(),

    lookAt: function () {

        let x = new VIZCore.Vector3();
        let y = new VIZCore.Vector3();
        let z = new VIZCore.Vector3();

        return function lookAt(eye, target, up) {

            let te = this.elements;

            z.subVectors(eye, target);

            if (z.lengthSq() === 0) {

                // eye and target are in the same position

                z.z = 1;

            }

            z.normalize();
            x.crossVectors(up, z);

            if (x.lengthSq() === 0) {

                // up and z are parallel

                if (Math.abs(up.z) === 1) {

                    z.x += 0.0001;

                } else {

                    z.z += 0.0001;

                }

                z.normalize();
                x.crossVectors(up, z);

            }

            x.normalize();
            y.crossVectors(z, x);

            te[0] = x.x; te[4] = y.x; te[8] = z.x;
            te[1] = x.y; te[5] = y.y; te[9] = z.y;
            te[2] = x.z; te[6] = y.z; te[10] = z.z;
            te[3] = 0; te[7] = 0; te[11] = 0;
            te[12] = eye.x;
            te[13] = eye.y;
            te[14] = eye.z;
            te[15] = 1;

            return this;

        };
    }(),
        
    multiply: function (m, n) {

        if (n !== undefined) {

            console.warn('THREE.Matrix4: .multiply() now only accepts one argument. Use .multiplyMatrices( a, b ) instead.');
            return this.multiplyMatrices(m, n);

        }

        return this.multiplyMatrices(this, m);

    },

    premultiply: function (m) {

        return this.multiplyMatrices(m, this);

    },

    multiplyMatrices: function (a, b) {

        let ae = a.elements;
        let be = b.elements;
        let te = this.elements;

        let a11 = ae[0], a12 = ae[4], a13 = ae[8], a14 = ae[12];
        let a21 = ae[1], a22 = ae[5], a23 = ae[9], a24 = ae[13];
        let a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
        let a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

        let b11 = be[0], b12 = be[4], b13 = be[8], b14 = be[12];
        let b21 = be[1], b22 = be[5], b23 = be[9], b24 = be[13];
        let b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
        let b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

        te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

        return this;

    },

    multiplyScalar: function (s) {

        let te = this.elements;

        te[0] *= s; te[4] *= s; te[8] *= s; te[12] *= s;
        te[1] *= s; te[5] *= s; te[9] *= s; te[13] *= s;
        te[2] *= s; te[6] *= s; te[10] *= s; te[14] *= s;
        te[3] *= s; te[7] *= s; te[11] *= s; te[15] *= s;

        return this;

    },

    applyToBufferAttribute: function () {

        let v1 = new VIZCore.Vector3();

        return function applyToBufferAttribute(attribute) {

            for (let i = 0, l = attribute.count; i < l; i++) {

                v1.x = attribute.getX(i);
                v1.y = attribute.getY(i);
                v1.z = attribute.getZ(i);

                v1.applyMatrix4(this);

                attribute.setXYZ(i, v1.x, v1.y, v1.z);

            }

            return attribute;

        };

    }(),

    determinant: function () {

        let te = this.elements;

        let n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
        let n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
        let n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
        let n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];

        //TODO: make this more efficient
        //( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

        return (
            n41 * (
                + n14 * n23 * n32
                - n13 * n24 * n32
                - n14 * n22 * n33
                + n12 * n24 * n33
                + n13 * n22 * n34
                - n12 * n23 * n34
            ) +
            n42 * (
                + n11 * n23 * n34
                - n11 * n24 * n33
                + n14 * n21 * n33
                - n13 * n21 * n34
                + n13 * n24 * n31
                - n14 * n23 * n31
            ) +
            n43 * (
                + n11 * n24 * n32
                - n11 * n22 * n34
                - n14 * n21 * n32
                + n12 * n21 * n34
                + n14 * n22 * n31
                - n12 * n24 * n31
            ) +
            n44 * (
                - n13 * n22 * n31
                - n11 * n23 * n32
                + n11 * n22 * n33
                + n13 * n21 * n32
                - n12 * n21 * n33
                + n12 * n23 * n31
            )

        );

    },

    transpose: function () {

        let te = this.elements;
        let tmp;

        tmp = te[1]; te[1] = te[4]; te[4] = tmp;
        tmp = te[2]; te[2] = te[8]; te[8] = tmp;
        tmp = te[6]; te[6] = te[9]; te[9] = tmp;

        tmp = te[3]; te[3] = te[12]; te[12] = tmp;
        tmp = te[7]; te[7] = te[13]; te[13] = tmp;
        tmp = te[11]; te[11] = te[14]; te[14] = tmp;

        return this;

    },

    setPosition: function (v) {

        let te = this.elements;

        te[12] = v.x;
        te[13] = v.y;
        te[14] = v.z;

        return this;

    },

    getInverse: function (m, throwOnDegenerate) {

        // based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
        let te = this.elements,
            me = m.elements,

            n11 = me[0], n21 = me[1], n31 = me[2], n41 = me[3],
            n12 = me[4], n22 = me[5], n32 = me[6], n42 = me[7],
            n13 = me[8], n23 = me[9], n33 = me[10], n43 = me[11],
            n14 = me[12], n24 = me[13], n34 = me[14], n44 = me[15],

            t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
            t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
            t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
            t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        let det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

        if (det === 0) {

            let msg = "THREE.Matrix4: .getInverse() can't invert matrix, determinant is 0";

            if (throwOnDegenerate === true) {

                throw new Error(msg);

            } else {

                console.warn(msg);

            }

            return this.identity();

        }

        let detInv = 1 / det;

        te[0] = t11 * detInv;
        te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
        te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
        te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

        te[4] = t12 * detInv;
        te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
        te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
        te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

        te[8] = t13 * detInv;
        te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
        te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
        te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

        te[12] = t14 * detInv;
        te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
        te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
        te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

        return this;

    },

    scale: function (v) {

        let te = this.elements;
        let x = v.x, y = v.y, z = v.z;

        te[0] *= x; te[4] *= y; te[8] *= z;
        te[1] *= x; te[5] *= y; te[9] *= z;
        te[2] *= x; te[6] *= y; te[10] *= z;
        te[3] *= x; te[7] *= y; te[11] *= z;

        return this;

    },

    getMaxScaleOnAxis: function () {

        let te = this.elements;

        let scaleXSq = te[0] * te[0] + te[1] * te[1] + te[2] * te[2];
        let scaleYSq = te[4] * te[4] + te[5] * te[5] + te[6] * te[6];
        let scaleZSq = te[8] * te[8] + te[9] * te[9] + te[10] * te[10];

        return Math.sqrt(Math.max(scaleXSq, scaleYSq, scaleZSq));

    },

    translate: function (x, y, z) {
        let te = this.elements;
        te[12] += x;
        te[13] += y;
        te[14] += z;
        return this;
    },

    makeTranslation: function (x, y, z) {

        this.set(

            1, 0, 0, x,
            0, 1, 0, y,
            0, 0, 1, z,
            0, 0, 0, 1

        );

        return this;

    },

    makeRotationX: function (theta) {

        let c = Math.cos(theta), s = Math.sin(theta);

        this.set(

            1, 0, 0, 0,
            0, c, - s, 0,
            0, s, c, 0,
            0, 0, 0, 1

        );

        return this;

    },

    makeRotationY: function (theta) {

        let c = Math.cos(theta), s = Math.sin(theta);

        this.set(

            c, 0, s, 0,
            0, 1, 0, 0,
            - s, 0, c, 0,
            0, 0, 0, 1

        );

        return this;

    },

    makeRotationZ: function (theta) {

        let c = Math.cos(theta), s = Math.sin(theta);

        this.set(

            c, - s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1

        );

        return this;

    },

    makeRotationAxis: function (axis, angle) {

        // Based on http://www.gamedev.net/reference/articles/article1199.asp

        let c = Math.cos(angle);
        let s = Math.sin(angle);
        let t = 1 - c;
        let x = axis.x, y = axis.y, z = axis.z;
        let tx = t * x, ty = t * y;

        this.set(

            tx * x + c, tx * y - s * z, tx * z + s * y, 0,
            tx * y + s * z, ty * y + c, ty * z - s * x, 0,
            tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
            0, 0, 0, 1

        );

        return this;

    },

    makeRotationAxis2: function (axis, angle) {

        // Based on http://www.gamedev.net/reference/articles/article1199.asp

        let c = Math.cos(angle);
        let s = Math.sin(angle);
        let t = 1 - c;
        let x = axis.x, y = axis.y, z = axis.z;
        let tx = t * x, ty = t * y;

        this.set2(

            tx * x + c, tx * y - s * z, tx * z + s * y, 0,
            tx * y + s * z, ty * y + c, ty * z - s * x, 0,
            tx * z - s * y, ty * z + s * x, t * z * z + c, 0,
            0, 0, 0, 1

        );

        return this;

    },

    makeScale: function (x, y, z) {

        this.set(

            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1

        );

        return this;

    },

    makeShear: function (x, y, z) {

        this.set(

            1, y, z, 0,
            x, 1, z, 0,
            x, y, 1, 0,
            0, 0, 0, 1

        );

        return this;

    },

    compose: function (position, quaternion, scale) {

        let te = this.elements;

        let x = quaternion._x, y = quaternion._y, z = quaternion._z, w = quaternion._w;
        let x2 = x + x, y2 = y + y, z2 = z + z;
        let xx = x * x2, xy = x * y2, xz = x * z2;
        let yy = y * y2, yz = y * z2, zz = z * z2;
        let wx = w * x2, wy = w * y2, wz = w * z2;

        let sx = scale.x, sy = scale.y, sz = scale.z;

        te[0] = (1 - (yy + zz)) * sx;
        te[1] = (xy + wz) * sx;
        te[2] = (xz - wy) * sx;
        te[3] = 0;

        te[4] = (xy - wz) * sy;
        te[5] = (1 - (xx + zz)) * sy;
        te[6] = (yz + wx) * sy;
        te[7] = 0;

        te[8] = (xz + wy) * sz;
        te[9] = (yz - wx) * sz;
        te[10] = (1 - (xx + yy)) * sz;
        te[11] = 0;

        te[12] = position.x;
        te[13] = position.y;
        te[14] = position.z;
        te[15] = 1;

        return this;

    },

    decompose: function () {

        let vector = new VIZCore.Vector3();
        let matrix = new VIZCore.Matrix4();

        return function decompose(position, quaternion, scale) {

            let te = this.elements;

            let sx = vector.set(te[0], te[1], te[2]).length();
            let sy = vector.set(te[4], te[5], te[6]).length();
            let sz = vector.set(te[8], te[9], te[10]).length();

            // if determine is negative, we need to invert one scale
            let det = this.determinant();
            if (det < 0) sx = - sx;

            position.x = te[12];
            position.y = te[13];
            position.z = te[14];

            // scale the rotation part
            matrix.copy(this);

            let invSX = 1 / sx;
            let invSY = 1 / sy;
            let invSZ = 1 / sz;

            matrix.elements[0] *= invSX;
            matrix.elements[1] *= invSX;
            matrix.elements[2] *= invSX;

            matrix.elements[4] *= invSY;
            matrix.elements[5] *= invSY;
            matrix.elements[6] *= invSY;

            matrix.elements[8] *= invSZ;
            matrix.elements[9] *= invSZ;
            matrix.elements[10] *= invSZ;

            quaternion.setFromRotationMatrix(matrix);

            scale.x = sx;
            scale.y = sy;
            scale.z = sz;

            return this;

        };

    }(),

    makePerspective: function (left, right, top, bottom, near, far) {

        if (far === undefined) {

            console.warn('THREE.Matrix4: .makePerspective() has been redefined and has a new signature. Please check the docs.');

        }

        let te = this.elements;
        let x = 2 * near / (right - left);
        let y = 2 * near / (top - bottom);

        let a = (right + left) / (right - left);
        let b = (top + bottom) / (top - bottom);
        let c = - (far + near) / (far - near);
        let d = - 2 * far * near / (far - near);

        te[0] = x; te[4] = 0; te[8] = a; te[12] = 0;
        te[1] = 0; te[5] = y; te[9] = b; te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = c; te[14] = d;
        te[3] = 0; te[7] = 0; te[11] = - 1; te[15] = 0;

        return this;

    },

    makeOrthographic: function (left, right, top, bottom, near, far) {

        let te = this.elements;
        let w = 1.0 / (right - left);
        let h = 1.0 / (top - bottom);
        let p = 1.0 / (far - near);

        let x = (right + left) * w;
        let y = (top + bottom) * h;
        let z = (far + near) * p;

        te[0] = 2 * w; te[4] = 0; te[8] = 0; te[12] = - x;
        te[1] = 0; te[5] = 2 * h; te[9] = 0; te[13] = - y;
        te[2] = 0; te[6] = 0; te[10] = - 2 * p; te[14] = - z;
        te[3] = 0; te[7] = 0; te[11] = 0; te[15] = 1;

        return this;

    },

    equals: function (matrix) {

        let te = this.elements;
        let me = matrix.elements;

        for (let i = 0; i < 16; i++) {

            if (te[i] !== me[i]) return false;

        }

        return true;

    },

    fromArray: function (array, offset) {

        if (offset === undefined) offset = 0;

        for (let i = 0; i < 16; i++) {

            this.elements[i] = array[i + offset];

        }

        return this;

    },

    toArray: function (array, offset) {

        if (array === undefined) array = [];
        if (offset === undefined) offset = 0;

        let te = this.elements;

        array[offset] = te[0];
        array[offset + 1] = te[1];
        array[offset + 2] = te[2];
        array[offset + 3] = te[3];

        array[offset + 4] = te[4];
        array[offset + 5] = te[5];
        array[offset + 6] = te[6];
        array[offset + 7] = te[7];

        array[offset + 8] = te[8];
        array[offset + 9] = te[9];
        array[offset + 10] = te[10];
        array[offset + 11] = te[11];

        array[offset + 12] = te[12];
        array[offset + 13] = te[13];
        array[offset + 14] = te[14];
        array[offset + 15] = te[15];

        return array;

    },
    getQuaternion: function () {
        let q = new VIZCore.Quaternion();
        q.setFromRotationMatrix(this);
        return q;
    },

    getScale: function () {
        let v = new VIZCore.Vector3();
        let te = this.elements;
        v.x = Math.sqrt(te[0] * te[0] + te[1] * te[1] + te[2] * te[2]);
        v.y = Math.sqrt(te[4] * te[4] + te[5] * te[5] + te[6] * te[6]);
        v.z = Math.sqrt(te[8] * te[8] + te[9] * te[9] + te[10] * te[10]);
        return v;
    },

    getTranslate: function () {
        let v = new VIZCore.Vector3();
        let te = this.elements;
        v.x = te[3 * 4 + 0];
        v.y = te[3 * 4 + 1];
        v.z = te[3 * 4 + 2];
        return v;
    },

    multiplyVector: function (a) {
        let ret = new VIZCore.Vector3();
        let te = this.elements;
        ret.x = a.x * te[0] + a.y * te[4] + a.z * te[8] + te[12];
        ret.y = a.x * te[1] + a.y * te[5] + a.z * te[9] + te[13];
        ret.z = a.x * te[2] + a.y * te[6] + a.z * te[10] + te[14];
        let w = a.x * te[3] + a.y * te[7] + a.z * te[11] + te[15];

        if (Math.abs(w) > 0.0000001)
            ret.divideScalar(w);

        return ret;
    },

    transNormal: function (a) {
        let ret = new VIZCore.Vector3();
        let te = this.elements;
        ret.x = a.x * te[0] + a.y * te[4] + a.z * te[8];
        ret.y = a.x * te[1] + a.y * te[5] + a.z * te[9];
        ret.z = a.x * te[2] + a.y * te[6] + a.z * te[10];
        //let w = a.x * te[3] + a.y * te[7] + a.z * te[11] + te[15];
        let len = ret.length();

        if (len < 0.0000000001) len = 1.0;

        ret.divideScalar(len);

        return ret;
    },

    rotate: function (x, y, z) {
        let rotateX = new VIZCore.Matrix4();
        let rotateY = new VIZCore.Matrix4();
        let rotateZ = new VIZCore.Matrix4();
        let rotate = new VIZCore.Matrix4();

        rotateX.makeRotationX(x);
        rotateY.makeRotationY(y);
        rotateZ.makeRotationZ(z);

        rotate.copy(rotateX.multiply(rotateY).multiply(rotateZ));

        //this.multiply(rotate);
        this.copy(rotate.multiply(this));
    },

    transformVector: function (m, v, dst) {
        dst = dst || new Float32Array(4);
        for (let i = 0; i < 4; ++i) {
            dst[i] = 0.0;
            for (let j = 0; j < 4; ++j) {
                dst[i] += v[j] * m[j * 4 + i];
            }
        }
        return dst;
    },

    perspective: function (fieldOfViewInRadians, aspect, near, far, dst) {
        dst = dst || new Float32Array(16);
        let f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
        let rangeInv = 1.0 / (near - far);

        dst[0] = f / aspect;
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;
        dst[4] = 0;
        dst[5] = f;
        dst[6] = 0;
        dst[7] = 0;
        dst[8] = 0;
        dst[9] = 0;
        dst[10] = (near + far) * rangeInv;
        dst[11] = -1;
        dst[12] = 0;
        dst[13] = 0;
        dst[14] = near * far * rangeInv * 2;
        dst[15] = 0;

        return dst;
    },

    orthographic: function (left, right, bottom, top, near, far, dst) {
        dst = dst || new Float32Array(16);

        dst[0] = 2 / (right - left);
        dst[1] = 0;
        dst[2] = 0;
        dst[3] = 0;
        dst[4] = 0;
        dst[5] = 2 / (top - bottom);
        dst[6] = 0;
        dst[7] = 0;
        dst[8] = 0;
        dst[9] = 0;
        dst[10] = 2 / (near - far);
        dst[11] = 0;
        dst[12] = (left + right) / (left - right);
        dst[13] = (bottom + top) / (bottom - top);
        dst[14] = (near + far) / (near - far);
        dst[15] = 1;

        return dst;
    },

    flip: function () {
        let te = this.elements;

        let matrix = new VIZCore.Matrix4();
        matrix.copy(this);
        let cte = matrix.elements;

        te[0] = cte[0];
        te[1] = cte[4];
        te[2] = cte[8];
        te[3] = cte[12];

        te[4] = cte[1];
        te[5] = cte[5];
        te[6] = cte[9];
        te[7] = cte[13];

        te[8] = cte[2];
        te[9] = cte[6];
        te[10] = cte[10];
        te[11] = cte[14];

        te[12] = cte[3];
        te[13] = cte[7];
        te[14] = cte[11];
        te[15] = cte[15];

        return this;
    }
});


//#endregion VIZCore Matrix4

//#region VIZCore Vector2
VIZCore.namespace("VIZCore.Vector2");
VIZCore.Vector2 = function (x, y) {

    this.x = x || 0;
    this.y = y || 0;

};

Object.defineProperties(VIZCore.Vector2.prototype, {

    "width": {

        get: function () {

            return this.x;

        },

        set: function (value) {

            this.x = value;

        }

    },

    "height": {

        get: function () {

            return this.y;

        },

        set: function (value) {

            this.y = value;

        }

    }

});

Object.assign(VIZCore.Vector2.prototype, {

    isVector2: true,

    set: function (x, y) {

        this.x = x;
        this.y = y;

        return this;

    },

    setScalar: function (scalar) {

        this.x = scalar;
        this.y = scalar;

        return this;

    },

    setX: function (x) {

        this.x = x;

        return this;

    },

    setY: function (y) {

        this.y = y;

        return this;

    },

    setComponent: function (index, value) {

        switch (index) {

            case 0: this.x = value; break;
            case 1: this.y = value; break;
            default: throw new Error('index is out of range: ' + index);

        }

        return this;

    },

    getComponent: function (index) {

        switch (index) {

            case 0: return this.x;
            case 1: return this.y;
            default: throw new Error('index is out of range: ' + index);

        }

    },

    clone: function () {

        return new this.constructor(this.x, this.y);

    },

    copy: function (v) {

        this.x = v.x;
        this.y = v.y;

        return this;

    },

    add: function (v, w) {

        if (w !== undefined) {

            console.warn('THREE.Vector2: .add() now only accepts one argument. Use .addVectors( a, b ) instead.');
            return this.addVectors(v, w);

        }

        this.x += v.x;
        this.y += v.y;

        return this;

    },

    addScalar: function (s) {

        this.x += s;
        this.y += s;

        return this;

    },

    addVectors: function (a, b) {

        this.x = a.x + b.x;
        this.y = a.y + b.y;

        return this;

    },

    addScaledVector: function (v, s) {

        this.x += v.x * s;
        this.y += v.y * s;

        return this;

    },

    sub: function (v, w) {

        if (w !== undefined) {

            console.warn('THREE.Vector2: .sub() now only accepts one argument. Use .subVectors( a, b ) instead.');
            return this.subVectors(v, w);

        }

        this.x -= v.x;
        this.y -= v.y;

        return this;

    },

    subScalar: function (s) {

        this.x -= s;
        this.y -= s;

        return this;

    },

    subVectors: function (a, b) {

        this.x = a.x - b.x;
        this.y = a.y - b.y;

        return this;

    },

    multiply: function (v) {

        this.x *= v.x;
        this.y *= v.y;

        return this;

    },

    multiplyScalar: function (scalar) {

        this.x *= scalar;
        this.y *= scalar;

        return this;

    },

    divide: function (v) {

        this.x /= v.x;
        this.y /= v.y;

        return this;

    },

    divideScalar: function (scalar) {

        return this.multiplyScalar(1 / scalar);

    },

    applyMatrix3: function (m) {

        let x = this.x, y = this.y;
        let e = m.elements;

        this.x = e[0] * x + e[3] * y + e[6];
        this.y = e[1] * x + e[4] * y + e[7];

        return this;

    },

    min: function (v) {

        this.x = Math.min(this.x, v.x);
        this.y = Math.min(this.y, v.y);

        return this;

    },

    max: function (v) {

        this.x = Math.max(this.x, v.x);
        this.y = Math.max(this.y, v.y);

        return this;

    },

    clamp: function (min, max) {

        // assumes min < max, componentwise

        this.x = Math.max(min.x, Math.min(max.x, this.x));
        this.y = Math.max(min.y, Math.min(max.y, this.y));

        return this;

    },

    clampScalar: function () {

        let min = new VIZCore.Vector2();
        let max = new VIZCore.Vector2();

        return function clampScalar(minVal, maxVal) {

            min.set(minVal, minVal);
            max.set(maxVal, maxVal);

            return this.clamp(min, max);

        };

    }(),

    clampLength: function (min, max) {

        let length = this.length();

        return this.divideScalar(length || 1).multiplyScalar(Math.max(min, Math.min(max, length)));

    },

    floor: function () {

        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);

        return this;

    },

    ceil: function () {

        this.x = Math.ceil(this.x);
        this.y = Math.ceil(this.y);

        return this;

    },

    round: function () {

        this.x = Math.round(this.x);
        this.y = Math.round(this.y);

        return this;

    },

    roundToZero: function () {

        this.x = (this.x < 0) ? Math.ceil(this.x) : Math.floor(this.x);
        this.y = (this.y < 0) ? Math.ceil(this.y) : Math.floor(this.y);

        return this;

    },

    negate: function () {

        this.x = - this.x;
        this.y = - this.y;

        return this;

    },

    dot: function (v) {

        return this.x * v.x + this.y * v.y;

    },

    cross: function (v) {

        return this.x * v.y - this.y * v.x;

    },

    lengthSq: function () {

        return this.x * this.x + this.y * this.y;

    },

    length: function () {

        return Math.sqrt(this.x * this.x + this.y * this.y);

    },

    manhattanLength: function () {

        return Math.abs(this.x) + Math.abs(this.y);

    },

    normalize: function () {

        return this.divideScalar(this.length() || 1);

    },

    angle: function () {

        // computes the angle in radians with respect to the positive x-axis

        let angle = Math.atan2(this.y, this.x);

        if (angle < 0) angle += 2 * Math.PI;

        return angle;

    },

    distanceTo: function (v) {

        return Math.sqrt(this.distanceToSquared(v));

    },

    distanceToSquared: function (v) {

        let dx = this.x - v.x, dy = this.y - v.y;
        return dx * dx + dy * dy;

    },

    manhattanDistanceTo: function (v) {

        return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);

    },

    setLength: function (length) {

        return this.normalize().multiplyScalar(length);

    },

    lerp: function (v, alpha) {

        this.x += (v.x - this.x) * alpha;
        this.y += (v.y - this.y) * alpha;

        return this;

    },

    lerpVectors: function (v1, v2, alpha) {

        return this.subVectors(v2, v1).multiplyScalar(alpha).add(v1);

    },

    equals: function (v) {

        return ((v.x === this.x) && (v.y === this.y));

    },

    fromArray: function (array, offset) {

        if (offset === undefined) offset = 0;

        this.x = array[offset];
        this.y = array[offset + 1];

        return this;

    },

    toArray: function (array, offset) {

        if (array === undefined) array = [];
        if (offset === undefined) offset = 0;

        array[offset] = this.x;
        array[offset + 1] = this.y;

        return array;

    },

    fromBufferAttribute: function (attribute, index, offset) {

        if (offset !== undefined) {

            console.warn('THREE.Vector2: offset has been removed from .fromBufferAttribute().');

        }

        this.x = attribute.getX(index);
        this.y = attribute.getY(index);

        return this;

    },

    rotateAround: function (center, angle) {

        let c = Math.cos(angle), s = Math.sin(angle);

        let x = this.x - center.x;
        let y = this.y - center.y;

        this.x = x * c - y * s + center.x;
        this.y = x * s + y * c + center.y;

        return this;

    }

});

//#endregion VIZCore Vector2

//#region VIZCore Quaternion
VIZCore.namespace("VIZCore.Quaternion");
VIZCore.Quaternion = function (x, y, z, w) {
    this._x = x || 0;
    this._y = y || 0;
    this._z = z || 0;
    this._w = (w !== undefined) ? w : 1;
};

Object.assign(VIZCore.Quaternion, {

    slerp: function (qa, qb, qm, t) {

        return qm.copy(qa).slerp(qb, t);

    },

    slerpFlat: function (dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t) {

        // fuzz-free, array-based Quaternion SLERP operation

        let x0 = src0[srcOffset0 + 0],
            y0 = src0[srcOffset0 + 1],
            z0 = src0[srcOffset0 + 2],
            w0 = src0[srcOffset0 + 3],

            x1 = src1[srcOffset1 + 0],
            y1 = src1[srcOffset1 + 1],
            z1 = src1[srcOffset1 + 2],
            w1 = src1[srcOffset1 + 3];

        if (w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1) {

            let s = 1 - t,

                cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,

                dir = (cos >= 0 ? 1 : - 1),
                sqrSin = 1 - cos * cos;

            // Skip the Slerp for tiny steps to avoid numeric problems:
            if (sqrSin > Number.EPSILON) {

                let sin = Math.sqrt(sqrSin),
                    len = Math.atan2(sin, cos * dir);

                s = Math.sin(s * len) / sin;
                t = Math.sin(t * len) / sin;

            }

            let tDir = t * dir;

            x0 = x0 * s + x1 * tDir;
            y0 = y0 * s + y1 * tDir;
            z0 = z0 * s + z1 * tDir;
            w0 = w0 * s + w1 * tDir;

            // Normalize in case we just did a lerp:
            if (s === 1 - t) {

                let f = 1 / Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0);

                x0 *= f;
                y0 *= f;
                z0 *= f;
                w0 *= f;

            }

        }

        dst[dstOffset] = x0;
        dst[dstOffset + 1] = y0;
        dst[dstOffset + 2] = z0;
        dst[dstOffset + 3] = w0;

    }

});


Object.defineProperties(VIZCore.Quaternion.prototype, {
    x: {
        get: function () {

            return this._x;

        },
        set: function (value) {

            this._x = value;
            this.onChangeCallback();

        }
    },
    y: {
        get: function () {

            return this._y;

        },
        set: function (value) {

            this._y = value;
            this.onChangeCallback();

        }
    },
    z: {
        get: function () {

            return this._z;

        },
        set: function (value) {

            this._z = value;
            this.onChangeCallback();

        }
    },
    w: {
        get: function () {

            return this._w;

        },
        set: function (value) {

            this._w = value;
            this.onChangeCallback();

        }
    }
});


Object.assign(VIZCore.Quaternion.prototype, {

    isQuaternion: true,

    set: function (x, y, z, w) {

        this._x = x;
        this._y = y;
        this._z = z;
        this._w = w;

        this.onChangeCallback();

        return this;

    },

    clone: function () {

        return new this.constructor(this._x, this._y, this._z, this._w);

    },

    copy: function (quaternion) {

        this._x = quaternion.x;
        this._y = quaternion.y;
        this._z = quaternion.z;
        this._w = quaternion.w;

        this.onChangeCallback();

        return this;

    },

    setFromEuler: function (euler, update) {

        if (!(euler && euler.isEuler)) {

            throw new Error('THREE.Quaternion: .setFromEuler() now expects an Euler rotation rather than a Vector3 and order.');

        }

        let x = euler._x, y = euler._y, z = euler._z, order = euler.order;

        // http://www.mathworks.com/matlabcentral/fileexchange/
        // 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
        //	content/SpinCalc.m

        let cos = Math.cos;
        let sin = Math.sin;

        let c1 = cos(x / 2);
        let c2 = cos(y / 2);
        let c3 = cos(z / 2);

        let s1 = sin(x / 2);
        let s2 = sin(y / 2);
        let s3 = sin(z / 2);

        if (order === 'XYZ') {

            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'YXZ') {

            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;

        } else if (order === 'ZXY') {

            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'ZYX') {

            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;

        } else if (order === 'YZX') {

            this._x = s1 * c2 * c3 + c1 * s2 * s3;
            this._y = c1 * s2 * c3 + s1 * c2 * s3;
            this._z = c1 * c2 * s3 - s1 * s2 * c3;
            this._w = c1 * c2 * c3 - s1 * s2 * s3;

        } else if (order === 'XZY') {

            this._x = s1 * c2 * c3 - c1 * s2 * s3;
            this._y = c1 * s2 * c3 - s1 * c2 * s3;
            this._z = c1 * c2 * s3 + s1 * s2 * c3;
            this._w = c1 * c2 * c3 + s1 * s2 * s3;

        }

        if (update !== false) this.onChangeCallback();

        return this;

    },

    setFromAxisAngle: function (axis, angle) {

        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

        // assumes axis is normalized

        let halfAngle = angle / 2, s = Math.sin(halfAngle);

        this._x = axis.x * s;
        this._y = axis.y * s;
        this._z = axis.z * s;
        this._w = Math.cos(halfAngle);

        this.onChangeCallback();

        return this;

    },

    setFromRotationMatrix: function (m) {

        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        let te = m.elements,

            m11 = te[0], m12 = te[4], m13 = te[8],
            m21 = te[1], m22 = te[5], m23 = te[9],
            m31 = te[2], m32 = te[6], m33 = te[10],

            trace = m11 + m22 + m33,
            s;

        if (trace > 0) {

            s = 0.5 / Math.sqrt(trace + 1.0);

            this._w = 0.25 / s;
            this._x = (m32 - m23) * s;
            this._y = (m13 - m31) * s;
            this._z = (m21 - m12) * s;

        } else if (m11 > m22 && m11 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);

            this._w = (m32 - m23) / s;
            this._x = 0.25 * s;
            this._y = (m12 + m21) / s;
            this._z = (m13 + m31) / s;

        } else if (m22 > m33) {

            s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);

            this._w = (m13 - m31) / s;
            this._x = (m12 + m21) / s;
            this._y = 0.25 * s;
            this._z = (m23 + m32) / s;

        } else {

            s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);

            this._w = (m21 - m12) / s;
            this._x = (m13 + m31) / s;
            this._y = (m23 + m32) / s;
            this._z = 0.25 * s;

        }

        this.onChangeCallback();

        return this;

    },

    setFromUnitVectors: function () {

        // assumes direction vectors vFrom and vTo are normalized

        let v1 = new VIZCore.Vector3();
        let r;

        let EPS = 0.000001;

        return function setFromUnitVectors(vFrom, vTo) {

            if (v1 === undefined) v1 = new VIZCore.Vector3();

            r = vFrom.dot(vTo) + 1;

            if (r < EPS) {

                r = 0;

                if (Math.abs(vFrom.x) > Math.abs(vFrom.z)) {

                    v1.set(- vFrom.y, vFrom.x, 0);

                } else {

                    v1.set(0, - vFrom.z, vFrom.y);

                }

            } else {

                v1.crossVectors(vFrom, vTo);

            }

            this._x = v1.x;
            this._y = v1.y;
            this._z = v1.z;
            this._w = r;

            return this.normalize();

        };

    }(),

    quaternionToEuler : function () {
        let euler = new VIZCore.Vector3();

        // Yaw (around Y-axis)
        let sinYaw = 2.0 * (this._w * this._y - this._x * this._z);
        let cosYaw = 1.0 - 2.0 * (this._y * this._y + this._z * this._z);
        euler.y = Math.atan2(sinYaw, cosYaw);

        // Pitch (around X-axis)
        let sinPitch = 2.0 * (this._w * this._x + this._y * this._z);
        if (Math.abs(sinPitch) >= 1.0) {
            euler.x = Math.sign(Math.PI / 2.0, sinPitch); // Use 90 degrees if out of range
        } else {
            euler.x = Math.asin(sinPitch);
        }

        // Roll (around Z-axis)
        let sinRoll = 2.0 * (this._w * this._z + this._x * this._y);
        let cosRoll = 1.0 - 2.0 * (this._x * this._x + this._z * this._z);
        euler.z = Math.atan2(sinRoll, cosRoll);

        return euler;
    },

    angleTo: function (q) {

        return 2 * Math.acos(Math.abs(Math.clamp(this.dot(q), - 1, 1)));

    },

    rotateTowards: function (q, step) {

        let angle = this.angleTo(q);

        if (angle === 0) return this;

        let t = Math.min(1, step / angle);

        this.slerp(q, t);

        return this;

    },

    inverse: function () {

        // quaternion is assumed to have unit length

        return this.conjugate();

    },

    conjugate: function () {

        this._x *= - 1;
        this._y *= - 1;
        this._z *= - 1;

        this.onChangeCallback();

        return this;

    },

    dot: function (v) {

        return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

    },

    lengthSq: function () {

        return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

    },

    length: function () {

        return Math.sqrt(this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w);

    },

    normalize: function () {

        let l = this.length();

        if (l === 0) {

            this._x = 0;
            this._y = 0;
            this._z = 0;
            this._w = 1;

        } else {

            l = 1 / l;

            this._x = this._x * l;
            this._y = this._y * l;
            this._z = this._z * l;
            this._w = this._w * l;

        }

        this.onChangeCallback();

        return this;

    },

    multiply: function (q, p) {

        if (p !== undefined) {

            console.warn('THREE.Quaternion: .multiply() now only accepts one argument. Use .multiplyQuaternions( a, b ) instead.');
            return this.multiplyQuaternions(q, p);

        }

        return this.multiplyQuaternions(this, q);

    },

    premultiply: function (q) {

        return this.multiplyQuaternions(q, this);

    },

    multiplyQuaternions: function (a, b) {

        // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

        let qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
        let qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

        this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
        this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
        this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
        this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

        this.onChangeCallback();

        return this;
    },

    slerp: function (qb, t) {

        if (t === 0) return this;
        if (t === 1) return this.copy(qb);

        let x = this._x, y = this._y, z = this._z, w = this._w;

        // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

        let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

        if (cosHalfTheta < 0) {

            this._w = - qb._w;
            this._x = - qb._x;
            this._y = - qb._y;
            this._z = - qb._z;

            cosHalfTheta = - cosHalfTheta;

        } else {

            this.copy(qb);

        }

        if (cosHalfTheta >= 1.0) {

            this._w = w;
            this._x = x;
            this._y = y;
            this._z = z;

            return this;

        }

        let sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

        if (sqrSinHalfTheta <= Number.EPSILON) {

            let s = 1 - t;
            this._w = s * w + t * this._w;
            this._x = s * x + t * this._x;
            this._y = s * y + t * this._y;
            this._z = s * z + t * this._z;

            return this.normalize();

        }

        let sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
        let halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
        let ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta,
            ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        this._w = (w * ratioA + this._w * ratioB);
        this._x = (x * ratioA + this._x * ratioB);
        this._y = (y * ratioA + this._y * ratioB);
        this._z = (z * ratioA + this._z * ratioB);

        this.onChangeCallback();

        return this;

    },

    equals: function (quaternion) {

        return (quaternion._x === this._x) && (quaternion._y === this._y) && (quaternion._z === this._z) && (quaternion._w === this._w);

    },

    fromArray: function (array, offset) {

        if (offset === undefined) offset = 0;

        this._x = array[offset];
        this._y = array[offset + 1];
        this._z = array[offset + 2];
        this._w = array[offset + 3];

        this.onChangeCallback();

        return this;

    },

    toArray: function (array, offset) {

        if (array === undefined) array = [];
        if (offset === undefined) offset = 0;

        array[offset] = this._x;
        array[offset + 1] = this._y;
        array[offset + 2] = this._z;
        array[offset + 3] = this._w;

        return array;

    },

    onChange: function (callback) {

        this.onChangeCallback = callback;

        return this;

    },

    onChangeCallback: function () { }

});

//#endregion VIZCore Quaternion

//#region VIZCore Plane
VIZCore.namespace("VIZCore.Plane");
VIZCore.Plane = function (normal, constant) {
    this.normal = (normal !== undefined) ? normal : new VIZCore.Vector3(1, 0, 0);
    this.constant = constant || 0;
};


Object.assign(VIZCore.Plane.prototype, {

    isPlane: true,

    set: function (normal, constant) {

        this.normal.copy(normal);
        this.constant = constant;

        return this;
    },

    setComponents: function (x, y, z, w) {

        this.normal.set(x, y, z);
        this.constant = w;

        return this;
    },

    setFromNormalAndCoplanarPoint: function (normal, point) {

        this.normal.copy(normal);
        //this.constant = - point.dot(this.normal);
        this.constant = -(normal.x*point.x + normal.y*point.y + normal.z*point.z);

        return this;
    },

    //setFromCoplanarPoints: function () {
    //
    //    //let v1 = new Vector3();
    //    //let v2 = new Vector3();
    //    //
    //    //return function setFromCoplanarPoints(a, b, c) {
    //    //
    //    //    let normal = v1.subVectors(c, b).cross(v2.subVectors(a, b)).normalize();
    //    //
    //    //    // Q: should an error be thrown if normal is zero (e.g. degenerate plane)?
    //    //
    //    //    this.setFromNormalAndCoplanarPoint(normal, a);
    //    //
    //    //    return this;
    //    //
    //    //};
    //}(),

    setFromCoplanarPoints: function (a, b, c) {

        let v1 = new VIZCore.Vector3().subVectors(b, a);
        let v2 = new VIZCore.Vector3().subVectors(c, a);

        this.normal.crossVectors(v1, v2);
        this.normal.normalize();

        this.constant = - (this.normal.dot(a));

        return this;
    },

    clone: function () {

        return new this.constructor().copy(this);
    },

    copy: function (plane) {

        this.normal.copy(plane.normal);
        this.constant = plane.constant;

        return this;
    },

    normalize: function () {

        // Note: will lead to a divide by zero if the plane is invalid.

        let inverseNormalLength = 1.0 / this.normal.length();
        this.normal.multiplyScalar(inverseNormalLength);
        this.constant *= inverseNormalLength;

        return this;
    },

    negate: function () {

        this.constant *= - 1;
        this.normal.negate();

        return this;
    },

    distanceToPoint: function (point) {

        return this.normal.dot(point) + this.constant;
    },

    distanceToSphere: function (sphere) {

        return this.distanceToPoint(sphere.center) - sphere.radius;
    },

    projectPoint: function (point, target) {

        if (target === undefined) {

            //console.warn('THREE.Plane: .projectPoint() target is now required');
            target = new VIZCore.Vector3();

        }

        return target.copy(this.normal).multiplyScalar(- this.distanceToPoint(point)).add(point);
    },

    
    
    intersectLine: function () {

        //let v1 = new Vector3();
        //
        //return function intersectLine(line, target) {
        //
        //    if (target === undefined) {
        //
        //        console.warn('THREE.Plane: .intersectLine() target is now required');
        //        target = new Vector3();
        //
        //    }
        //
        //    let direction = line.delta(v1);
        //
        //    let denominator = this.normal.dot(direction);
        //
        //    if (denominator === 0) {
        //
        //        // line is coplanar, return origin
        //        if (this.distanceToPoint(line.start) === 0) {
        //
        //            return target.copy(line.start);
        //
        //        }
        //
        //        // Unsure if this is the correct method to handle this case.
        //        return undefined;
        //
        //    }
        //
        //    let t = - (line.start.dot(this.normal) + this.constant) / denominator;
        //
        //    if (t < 0 || t > 1) {
        //
        //        return undefined;
        //
        //    }
        //
        //    return target.copy(direction).multiplyScalar(t).add(line.start);
        //
        //};

    }(),

    intersectsLine: function (line) {

        // Note: this tests if a line intersects the plane, not whether it (or its end-points) are coplanar with it.

        let startSign = this.distanceToPoint(line.start);
        let endSign = this.distanceToPoint(line.end);

        return (startSign < 0 && endSign > 0) || (endSign < 0 && startSign > 0);

    },

    intersectsBox: function (box) {

        return box.intersectsPlane(this);

    },

    intersectsSphere: function (sphere) {

        return sphere.intersectsPlane(this);

    },

    coplanarPoint: function (target) {

        if (target === undefined) {

            console.warn('THREE.Plane: .coplanarPoint() target is now required');
            target = new VIZCore.Vector3();

        }

        return target.copy(this.normal).multiplyScalar(- this.constant);

    },

    applyMatrix4: function (matrix, optionalNormalMatrix) {
        let v1 = new VIZCore.Vector3();
        let m1 = new VIZCore.Matrix3();

        let normalMatrix = optionalNormalMatrix || m1.getNormalMatrix(matrix);

        let referencePoint = this.coplanarPoint(v1).applyMatrix4(matrix);

        let normal = this.normal.applyMatrix3(normalMatrix).normalize();

        this.constant = - referencePoint.dot(normal);

        return this;
    },

    translate: function (offset) {

        this.constant -= offset.dot(this.normal);

        return this;

    },

    equals: function (plane) {

        return plane.normal.equals(this.normal) && (plane.constant === this.constant);

    }

});


VIZCore.namespace("VIZCore.shPlane");
VIZCore.shPlane = function () {
    this.org = new VIZCore.Vector3();
    this.xvec = new VIZCore.Vector3(1, 0, 0);
    this.yvec = new VIZCore.Vector3(0, 1, 0);
    this.zvec = new VIZCore.Vector3(0, 0, 1);
};


Object.assign(VIZCore.shPlane.prototype, {

    isPlane: true,

    clone: function () {
        return new this.constructor().copy(this);
    },

    copy: function (plane) {
        this.org.copy(plane.org);
        this.xvec.copy(plane.xvec);
        this.yvec.copy(plane.yvec);
        this.zvec.copy(plane.zvec);

        return this;
    },


    setFromTriangle: function (triangle) {

        let a = [triangle.vertex.v1, triangle.vertex.v2, triangle.vertex.v3];
        
        let v = [];
        
        v[0] = new VIZCore.Vector3().subVectors(a[1], a[0]);
        let lenght0 = v[0].length();
        
        v[1] = new VIZCore.Vector3().subVectors(a[2], a[1]);
        let lenght1 = v[1].length();
        
        v[2] = new VIZCore.Vector3().subVectors(a[0], a[2]);
        let lenght2 = v[1].length();
        
        let minLengthNum = 0;
        let minLength = lenght0;
        
        if (lenght1 < minLength) {
            minLengthNum = 1;
            minLength = lenght1;
        }
        if (lenght2 < minLength) {
            minLengthNum = 2;
            minLength = lenght2;
        }
        
        let i0 = (minLengthNum + 2) % 3;
        let i1 = (i0 + 2) % 3;
        
        
        let ref = new VIZCore.Vector3().subVectors(a[i1], a[i0]);
        
        this.org = new VIZCore.Vector3().copy(a[i0]);
        this.zvec = new VIZCore.Vector3().crossVectors(v[i0], ref); this.zvec.normalize();
        this.xvec = new VIZCore.Vector3().copy(v[i0]); this.xvec.normalize();
        this.yvec = new VIZCore.Vector3().crossVectors(this.zvec, this.xvec); this.yvec.normalize();

        return this;
    },

    getLocalPoint: function (v3) {
        let sv = new VIZCore.Vector3().subVectors(v3, this.org);
        return new VIZCore.Vector3(sv.dot(this.xvec), sv.dot(this.yvec), sv.dot(this.zvec));
    },

    getGlobalPoint: function (v2) {
        return new VIZCore.Vector3().addVectors(this.org,
            new VIZCore.Vector3().addVectors(this.xvec.multiplyScalar(v2.x),
                this.yvec.multiplyScalar(v2.y)));
    },

    equals: function (plane) {
        return plane.org.equals(this.org) && plane.xvec.equals(this.xvec) && plane.yvec.equals(this.yvec) && plane.zvec.equals(this.zvec);
    }

});

//#endregion VIZCore Plane

//#region Rect
VIZCore.namespace("VIZCore.Rect");
VIZCore.Rect = function (left, top, right, bottom) {
    this.left = (left !== undefined) ? left : 0;
    this.top = (top !== undefined) ? top : 0;
    this.right = (right !== undefined) ? right : 0;
    this.bottom = (bottom !== undefined) ? bottom : 0;
};

Object.assign(VIZCore.Rect.prototype, {

    isRect: true,

    set: function (left, top, right, bottom) {

        this.left = (left !== undefined) ? left : 0;
        this.top = (top !== undefined) ? top : 0;
        this.right = (right !== undefined) ? right : 0;
        this.bottom = (bottom !== undefined) ? bottom : 0;
        return this;
    },

    copy: function (rect) {
        this.left = rect.left;
        this.top = rect.top;
        this.right = rect.right;
        this.bottom = rect.bottom;

        return this;
    },

    clone: function () {
        return new this.constructor().copy(this);
    },

    isPointInRect: function (x, y) {
        if (x >= this.left && x <= this.right &&
            y >= this.top && y <= this.bottom)
            return true;
        return false;
    },

    isRectInRectAll: function (r) {

        if (this.isPointInRect(r.left, r.top) && this.isPointInRect(r.left, r.bottom) &&
            this.isPointInRect(r.right, r.top) && this.isPointInRect(r.right, r.bottom)) {
            return true;
        }
        return false;
    },

    isRectInRect: function (r) {
        if (this.isPointInRect(r.left, r.top) || this.isPointInRect(r.left, r.bottom) ||
            this.isPointInRect(r.right, r.top) || this.isPointInRect(r.right, r.bottom)) {
            return true;
        }
        return false;
    },

    getWidth: function() {
        return this.right - this.left; 
    },

    getHeight: function() {
        return this.bottom - this.top; 
    }
});

//#endregion Rect

//#region BBox

VIZCore.namespace("VIZCore.BBox");
VIZCore.BBox = function (arr) {
    if (arr === undefined) {
        this.min = new VIZCore.Vector3();
        this.max = new VIZCore.Vector3();
        this.center = new VIZCore.Vector3();
        this.radius = 0;
    }
    else {
        this.min = new VIZCore.Vector3(arr[0], arr[1], arr[2]);
        this.max = new VIZCore.Vector3(arr[3], arr[4], arr[5]);
        this.center = new VIZCore.Vector3((arr[0] + arr[3]) / 2, (arr[1] + arr[4]) / 2, (arr[2] + arr[5]) / 2);
        this.radius = new VIZCore.Vector3().copy(this.center).sub(this.min).length();
    }
    
};

Object.assign(VIZCore.BBox.prototype, {
    set : function(vMin, vMax)
    {
        this.min.copy(vMin);
        this.max.copy(vMax);
        this.update();
        return this;
    },

    copy: function (bbox) {

        this.min.copy(bbox.min);
        this.max.copy(bbox.max);
        this.center.copy(bbox.center);
        this.radius = bbox.radius;

        return this;
    },

    append: function (bbox) {
        this.min.min(bbox.min);
        this.max.max(bbox.max);

        this.center = new VIZCore.Vector3((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, (this.min.z + this.max.z) / 2);
        this.radius = new VIZCore.Vector3().copy(this.center).sub(this.min).length();
    },

    update: function () {
        this.center = new VIZCore.Vector3((this.min.x + this.max.x) / 2, (this.min.y + this.max.y) / 2, (this.min.z + this.max.z) / 2);
        this.radius = new VIZCore.Vector3().copy(this.center).sub(this.min).length();
    },

    isInBoundBox: function (vPos, fTol) {
        if (vPos.x >= this.min.x - fTol && vPos.x <= this.max.x + fTol && vPos.y >= this.min.y - fTol && vPos.y <= this.max.y + fTol && vPos.z >= this.min.z - fTol && vPos.z <= this.max.z + fTol)
            return true;

        return false;
    },

    isInBoundBox2D: function (vPos, fTol) {
        if (vPos.x >= this.min.x - fTol && vPos.x <= this.max.x + fTol && vPos.y >= this.min.y - fTol && vPos.y <= this.max.y + fTol)
            return true;
        return false;
    }
});

//VIZCore.namespace("VIZCore.Plane");
//VIZCore.Plane = function () {
//    this.a = 0;
//    this.b = 0;
//    this.c = 0;
//    this.d = 0;
//};

//Object.assign(VIZCore.Plane.prototype, {
//    set: function (normal, point) {
//        this.a = normal.x;
//        this.b = normal.y;
//        this.c = normal.z;
//        this.d = -(a * point.x + b * point.y + c * point.z);
//    },
//    getProjectionLen: function (v) {
//        return v.x * this.a + v.y * this.b + v.z * this.c + d;
//    }
//});


//#endregion BBox


VIZCore.namespace("VIZCore.EventDispatcher");
VIZCore.EventDispatcher = EventDispatcher;



export default VIZCore;

