const yaml = require('js-yaml');
const fs = require('fs');
const _ = require('lodash');
const path = require('path');

function findException(jsonObj:any, code:string):any {
  let keys = Object.keys(jsonObj);
  for (const key of keys) {
    if (jsonObj[key].hasOwnProperty("code")) {
      if (jsonObj[key].code === code) {
        jsonObj[key].name = key;
        return jsonObj[key];
      }
    } else {
      if (typeof jsonObj[key] !== 'object') {
        continue;
      }
      let ret = findException(jsonObj[key], code);
      if (typeof ret === 'object') {
        return ret;
      }
    }
  }
}

function getExceptionList(jsonObj: any): any {
  let list: any[] = [];
  let parents: string[] = [];
  getExceptionListInner(list, parents, jsonObj);
  return list;
}

function getExceptionListInner(list: any[], parents: string[], jsonObj: any): any {
  let keys = Object.keys(jsonObj);
  for (const key of keys) {
    if (jsonObj[key].hasOwnProperty("code")) {
      let prev = parents.reduce( (accumulator, currentValue) => accumulator + _.upperFirst(currentValue), "");

      jsonObj[key].name = prev+_.upperFirst(key);
      list.push(jsonObj[key]);
    } else {
      if (typeof jsonObj[key] !== 'object') {
        continue;
      }
      if (key !== 'exception') {
        parents.push(key);
      }
      getExceptionListInner(list, parents, jsonObj[key]);
      parents.pop();
    }
  }
}

function createCustomError(jsonObj: any, dstFolder: string) {
  let className = jsonObj.name + "Error";
  let fd = fs.openSync(`${dstFolder}/${className}.ts`, 'w');

  fs.appendFileSync(fd,
    `"use strict";

import CustomError from "@/errors/CustomError";

class ${className} extends CustomError {
  static ownCode : string = "${jsonObj.code}";
  constructor(message: string, uuid: string) {
    super(${className}.ownCode, message, uuid);
  }
}

export default ${className};`);

  fs.closeSync(fd);
}

function createErrorFactory(exceptionList:any[], dstFolder:string) {
  let fd = fs.openSync(`${dstFolder}/ErrorFactory.ts`, 'w');

  fs.appendFileSync(fd,
    `'use strict';

import i18nException from "@i18n/exception_ko.yml"

`);
  exceptionList.forEach( item => {
    fs.appendFileSync(fd, `import ${item.name}Error from "@/errors/impl/${item.name}Error";\n`);
  });

  fs.appendFileSync(fd,`
class ErrorFactory {
  static classMap : any = {\n`);
  exceptionList.forEach( item => {
    fs.appendFileSync(fd,`\t\t${item.name}Error : ${item.name}Error,\n`);
  })
  fs.appendFileSync(fd,`};
  constructor() {
  }

  static createError(responseJson:any) {
  `);

  fs.appendFileSync(fd,`
  
    let foundClass:any = Object.values(ErrorFactory.classMap).find( (item:any) => item.ownCode === responseJson.code );
  
    const args = [responseJson.message, responseJson.uuid];
    const instance : InternalError = Reflect.construct(foundClass, args);
    console.log(instance.name, instance.code, instance.message, instance.uuid);
    return instance;
  }
}

export default ErrorFactory;`);

  fs.closeSync(fd);
}

function main() {
  try {
    const doc = yaml.load(fs.readFileSync('./src/main/resources/i18n/exception_ko.yml', 'utf8'));

    let exceptionList:any[] = getExceptionList(doc);

    let errorsFolder = path.resolve(__dirname, "../project_front/src/errors");
    let errorsImplFolder = path.resolve(errorsFolder, "./impl");

    fs.rmSync(errorsImplFolder, {
      recursive: true, force: true
    });

    if(!fs.existsSync(errorsImplFolder)){
      fs.mkdirSync(errorsImplFolder, { recursive: true});
    }

    exceptionList.forEach(item => createCustomError(item, errorsImplFolder));

    createErrorFactory(exceptionList, errorsFolder);

  } catch (e) {
    console.log("createCustomErrors failed. " + e);
  }
}

main();