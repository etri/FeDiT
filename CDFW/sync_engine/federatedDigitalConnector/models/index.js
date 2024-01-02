const Kafka = require("./modules/kafka");
const Mqtt = require("./modules/mqtt");
const Postgres = require("./modules/postgres");

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

   get mqtt() {
      return this.#getInstance(Mqtt);
   }

   get postgres() {
      return this.#getInstance(Postgres);
   }
}

module.exports = Models;
