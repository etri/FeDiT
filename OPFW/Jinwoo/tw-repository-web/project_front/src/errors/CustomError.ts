'use strict';

class CustomError extends Error {
  code:string;
  uuid:string;
  constructor(code:string, message: string, uuid: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.uuid = uuid;
  }
}

export default CustomError;