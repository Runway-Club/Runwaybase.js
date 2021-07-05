const runwaybase = require("../../dist");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(bodyParser.json());

var server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let runwayApp = runwaybase.Runwaybase.App;

let driver = new runwaybase.MemoryDataDriver();
runwayApp.initialize(io, app, driver);

server.listen(8989, () => {
  console.log("IO is running on 8989");
});

app.listen(9898, () => {
  console.log("Server is running on 8080");
});
