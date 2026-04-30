const digitalObjects = require("./modules/digitalObjects");
const digitalTwins = require("./modules/digitalTwins");
const services = require("./modules/services");
const simulations = require("./modules/simulations");
const visualModels = require("./modules/visualModels");
const dataLinkage = require("./modules/dataLinkage");
const identifier = require("./modules/identifier");

class Services {
  #getInstance(_class) {
    const className = _class.name;

    // instance 최초 생성
    if (!this[className]) {
      this[className] = new _class();
    }

    return this[className];
  }

  get digitalObjects() {
    return this.#getInstance(digitalObjects);
  }
  get digitalTwins() {
    return this.#getInstance(digitalTwins);
  }
  get services() {
    return this.#getInstance(services);
  }
  get simulations() {
    return this.#getInstance(simulations);
  }
  get visualModels() {
    return this.#getInstance(visualModels);
  }
  get dataLinkage() {
    return this.#getInstance(dataLinkage);
  }
  get identifier() {
    return this.#getInstance(identifier);
  }
}

module.exports = new Services();
