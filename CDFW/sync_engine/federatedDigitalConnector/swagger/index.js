const { swaggerUi, specs } = require("./swagger");

module.exports = (app) => {
   app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};
