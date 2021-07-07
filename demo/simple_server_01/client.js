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

app.realtime.db
  .collection("users/profiles")
  .docs()
  .subscribe((data) => {
    // console.log(data);
    // console.log(data.length);
  });

app.realtime.db.onSnapshot(DataEvent.Deleted).subscribe((data) => {
  console.log(data);
});

app.realtime.db.collection("users").doc().create("Data");
setTimeout(async () => {
  let result = await app.realtime.db.deleteSubcollection("users");
  // let result = await app.realtime.db.deleteSubcollection("users");

  console.log(result);
}, 5000);
let docs = [];

// setInterval(() => {
//   let id = Date.now();
//   docs.push(id);
//   app.realtime.db
//     .collection("users")
//     .collection("profiles")
//     .doc(id)
//     .create({
//       name: "Teoflio",
//       yob: 1998,
//     })
//     .then((r) => {
//       // console.log(r);
//     })
//     .catch((err) => console.error(err));
// }, 1000);

// setInterval(() => {
//   let id = docs.pop();
//   app.realtime.db
//     .collection("users")
//     .collection("profiles")
//     .doc(id)
//     .update("Updated")
//     .then((r) => {
//       console.log(r);
//     })
//     .catch((err) => console.error(err));
// }, 5000);
