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

setInterval(() => {
  let id = Date.now();
  app.realtime.db
    .collection("users")
    .doc(id)
    .create({
      name: "Teoflio " + id,
      yob: 1998,
      address: {
        no: 4,
        street: "Bui Hien",
      },
    });
}, 5000);
