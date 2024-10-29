const Kafka = require("./modules/kafka");
const Postgres = require("./modules/postgres");
const Ajv = require("./modules/ajv");

class Models {
   #getInstance(_class) {
      const className = _class.name;

      // instance 최초 생성
      if (!this[className]) {
         this[className] = new _class();
      }

      return this[className];
   }

   get kafka() {
      return this.#getInstance(Kafka);
   }

   get postgres() {
      return this.#getInstance(Postgres);
   }

   get ajv() {
      return this.#getInstance(Ajv);
   }
}

module.exports = Models;
