const runway = require("../../dist");
const { DataEvent } = require("../../dist/client/Collection");

let app = new runway.Client.Runwaybase();

app.initialize({
  restEndpoint: "http://localhost:9898/runwaybase/realtime",
  ioEndpoint: "http://localhost:8989",
});

app.realtime.db
  .collection("users")
  .docs()
  .subscribe((data) => {
    console.log(data);
  });

// setInterval(() => {
//   app.realtime.db
//     .collection("users")
//     .doc(Date.now())
//     .create({
//       name: "Teoflio",
//       yob: 1998,
//     })
//     .then((r) => {
//       console.log(r);
//     })
//     .catch((err) => console.error(err));
// }, 1000);
