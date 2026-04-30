const federatedDigitalObjects = require("./modules/federatedDigitalObjects");
const federatedDigitalTwins = require("./modules/federatedDigitalTwins");
const simulations = require("./modules/simulations");
const services = require("./modules/services");
const visualModel = require("./modules/visualModel");
const subscriptions = require("./modules/subscriptions");
const accessPolicy = require("./modules/accessPolicy");
const controlNotificationWorker = require("./modules/controlNotificationWorker");
class Services {
  #getInstance(_class) {
    const className = _class.name;

    // instance 최초 생성
    if (!this[className]) {
      this[className] = new _class();
    }

    return this[className];
  }

  get federatedDigitalObjects() {
    return this.#getInstance(federatedDigitalObjects);
  }

  get federatedDigitalTwins() {
    return this.#getInstance(federatedDigitalTwins);
  }

  get simulations() {
    return this.#getInstance(simulations);
  }

  get services() {
    return this.#getInstance(services);
  }

  get visualModel() {
    return this.#getInstance(visualModel);
  }

  get subscriptions() {
    return this.#getInstance(subscriptions);
  }

  get accessPolicy() {
    return this.#getInstance(accessPolicy);
  }

  get controlNotificationWorker() {
    return this.#getInstance(controlNotificationWorker);
  }
}

module.exports = new Services();
