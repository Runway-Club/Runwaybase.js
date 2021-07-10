const runwayClub = require("../../dist/");
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

let runwayApp = runwayClub.Core.Runwaybase.App;

let driver = new runwayClub.Drivers.SQLiteDriver("./test.sqlite");

runwayApp.initialize(io, app, driver);

const ioPort = 8989;
server.listen(ioPort, () => {
  console.log(`IO is running on ${ioPort}`);
});

const serverPort = 9898;
app.listen(serverPort, () => {
  console.log(`Server is running on ${serverPort}`);
});
