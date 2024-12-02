'use strict';

class Singleton {
  static instance:Singleton;

  name:string;

  constructor() {
    this.name = 'Singleton';
    console.log("Singleton constructor called");
  }

  static getInstance() {
    if(this.instance){
      return this.instance;
    }

    this.instance = new Singleton();
    this.instance.initialize();
    return this.instance;
  }

  initialize () {

  }

  test() {
    console.log("test");
  }
}

const singletonInstance: Singleton = Singleton.getInstance();
Object.freeze(singletonInstance);

export default singletonInstance;