const express = require("express");
const app = express();
const http = require("http");
const port = 3001;
const util = require("util");

// body parser
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  }),
);

const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Server Start on port ${port}/receiver`);
});
timestamp = () => {
  let today = new Date();
  today.setHours(today.getHours());
  return today.toISOString().replace("T", " ").substring(0, 23);
};
// ================================================================
// 정규식으로 전부 매칭
app.all(/.*/, (req, res) => {
  console.log(`\n[${timestamp()}] ====================`);
  console.log(`📌 [${req.method}] Request URL: ${req.originalUrl}`);
  console.log("📦 Request Body:");
  console.log(util.inspect(req.body, false, null, true));

  res.json({ res: timestamp() });
});
