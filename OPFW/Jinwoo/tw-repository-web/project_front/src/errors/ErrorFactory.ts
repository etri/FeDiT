'use strict';

import CustomError from "@/errors/CustomError";

class ErrorFactory {
  // static createError(responseJson:any) {
  //
  //
  //   let foundClass:any = Object.values(ErrorFactory.classMap).find( (item:any) => item.ownCode === responseJson.code );
  //
  //   const args = [responseJson.message, responseJson.uuid];
  //   const instance : InternalError = Reflect.construct(foundClass, args);
  //   console.log(instance.name, instance.code, instance.message, instance.uuid);
  //   return instance;
  // }

  static createError(responseJson:any) {
    return new CustomError(responseJson.code, responseJson.message, responseJson.uuid);
  }
}

export default ErrorFactory;