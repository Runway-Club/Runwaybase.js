
import { expect } from 'chai';
import { io, Socket } from 'socket.io-client';
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http'
import axios from 'axios';
import { v4 } from 'uuid';
import { Runwaybase } from '../src/core';
import { Runwaybase as RunwaybaseClient } from '../src/client';
import { MemoryDataDriver } from '../src/drivers/Mem/MemoryDataDriver';
import { QueryCommand, ChangeSnapshot, QueryResult } from '../src/realtime';
import { DataEvent } from '../src/client/Collection';

describe("Interoperation Tests", () => {
    let runwayApp = Runwaybase.App;
    let driver = new MemoryDataDriver();
    let clientApp = new RunwaybaseClient();
    let app = express();
    let httpServer = createServer();

    httpServer.listen(8989);
    let serverApp = app.listen(9898);

    beforeAll(() => {
        let server = new Server();
        runwayApp.initialize(server, app, driver);

        clientApp.initialize({
            restEndpoint: "http://localhost:9898/runwaybase/realtime",
            ioEndpoint: "http://localhost:8989",
        });

        // app.listen(9898);

    });

    beforeEach((done) => {
        driver.connect().then(() => done());
    })

    it("Get doc changes", () => {
        clientApp.realtime.db.collection("users").docs().subscribe((docs) => {
            expect(docs.length).to.be.equal(1);
            expect(docs[0].key).to.be.equal("001");
            expect(docs[0].value['name']).to.be.equal("Teoflio");

        });

        clientApp.realtime.db.collection("users").doc("001").create({
            name: "Teoflio"
        });
    })

    it("Get doc changes many times", () => {
        let times = 0;

        clientApp.realtime.db.collection("users").docs().subscribe((docs) => {
            if (times == 0) {
                expect(docs.length).to.be.equal(0);
                times++;
            }
            else if (times == 1) {
                expect(docs.length).to.be.equal(1);
                expect(docs[0].key).to.be.equal("001");
                times++;
            }
            else {
                expect(docs.length).to.be.equal(2);
                expect(docs[0].key).to.be.equal("001");
                expect(docs[1].key).to.be.equal("002");
            }
        })

        setTimeout(() => {
            clientApp.realtime.db.collection("users").doc("001").create({
                name: "Teoflio"
            });
        }, 300);

        setTimeout(() => {
            clientApp.realtime.db.collection("users").doc("002").create({
                name: "Cuden"
            });
        }, 700);

    });

    it("Get doc inexists", () => {
        clientApp.realtime.db.collection("users").docs().subscribe((doc) => {
            expect(doc[0].key).to.be.not.equal("001");
        });
        clientApp.realtime.db.collection("users").doc().create({
            "name": "Test"
        })
    });
    it("Create doc", () => {
        clientApp.realtime.db.collection('users').docs().subscribe((docs) => {
            if (docs.length == 0) {
                return;
            }
            expect(docs.length).to.be.equal(1);
            expect(docs[0].value['name']).to.be.equal("Hỏng hiểu");
        })

        clientApp.realtime.db.collection('users').doc("hello").create({
            name: "Hỏng hiểu",
        }).then((data) => {
            expect(data.isError).to.be.equal(false);
            expect(data.affected).to.be.equal(1);

        });
    });
    it("On Snapshot added", () => {
        clientApp.realtime.db.collection('users').onSnapshot(DataEvent.Added).subscribe((change) => {
            expect(change.key ?? "").to.be.equal("ahihi");
            expect(change.value?.name ?? "").to.be.equal("Van Huu Gia Kien");
        });
        clientApp.realtime.db.collection("users").doc("ahihi").create({
            "name": "Van Huu Gia Kien",
            "yob": "2000",
            "isMale": true
        })
        clientApp.realtime.db.collection("users").doc("ahihi").update({
            "name": "Van Hien Gia **"
        })
    })
    it("On Snapshot Updated", () => {
        clientApp.realtime.db.collection('users').onSnapshot(DataEvent.Updated).subscribe((change) => {
            expect(change.key ?? "").to.be.equal("ahihi");
            expect(change.value?.name ?? "").to.be.equal("Van Hien Gia **");
        });
        clientApp.realtime.db.collection("users").doc("ahihi").create({
            "name": "Van Huu Gia Kien",
            "yob": "2000",
            "isMale": true
        })
        clientApp.realtime.db.collection("users").doc("ahihi").update({
            "name": "Van Hien Gia **"
        })
        clientApp.realtime.db.collection("users").doc("ahihi").create({
            "name": "Cuden",
            "yob": "1998",
            "isMale": true
        })
    })
    it("Create doc in a subcollection", () => {
        let times = 0;
        clientApp.realtime.db.collection('users').docs().subscribe((docs) => {
            if (docs.length == 0) {
                times++;
                return;
            }
            if (times == 1) {
                expect(docs.length).to.be.equal(0);
                return;
            }
            expect.fail();
        });

        clientApp.realtime.db.collection('users/profiles').docs().subscribe((docs) => {
            if (docs.length == 0) {
                return;
            }
            expect(docs.length).to.be.equal(1);
        });

        clientApp.realtime.db.collection('users/profiles').doc("hello").create({
            name: "Hỏng hiểu",
        }).then((data) => {
            expect(data.isError).to.be.equal(false);
            expect(data.affected).to.be.equal(1);

        });
    });

    it("Update doc's value", () => {
        clientApp.realtime.db.collection("users").docs().subscribe((doc) => {
            expect(doc[0].value["name"]).to.be.equal("Van Hien Gia **")
        })

        clientApp.realtime.db.collection("users").doc("ahihi").create({
            "name": "Van Huu Gia Kien",
            "yob": "2000",
            "isMale": true
        })
        clientApp.realtime.db.collection("users").doc("ahihi").update({
            "name": "Van Hien Gia **"
        })
    })
    it("Update doc without key", () => {
        clientApp.realtime.db.collection("users").docs().subscribe((doc) => {
            expect(doc[0].key).to.be.false;
        })

        clientApp.realtime.db.collection("users").doc("ahihi").create({
            "name": "Van Huu Gia Kien",
            "yob": 2000,
            "isMale": true
        })
        clientApp.realtime.db.collection("users").doc().update({
            "yob": 2001
        })
    })
    it("Delete doc", () => {

        let docId = Date.now().toString();
        clientApp.realtime.db.collection("friends").docs().subscribe((doc) => {
            expect(doc[0]).to.be.undefined;
        })

        clientApp.realtime.db.collection("friends").doc(docId).create([
            "abc",
            "XYZ",
            "YMg"
        ]);
        clientApp.realtime.db.collection("friends").doc(docId).delete();
    })
    it("Delete Subcollection", () => {
        clientApp.realtime.db.collection('user').onSnapshot(DataEvent.Deleted).subscribe((data) => {
            expect(data.collectionId ?? "").to.be.equal("TMA");
        });
        clientApp.realtime.db.collection('user').collection("TMA").doc('Chời ơi cái quần què dĩ dây').create({
            name: 'Ụ ụ',
            slogan: 'Ụ, ụ á ụ á, ụuuuu'
        })
        clientApp.realtime.db.collection('user').deleteSubcollection("TMA");
    })

    afterAll(() => {
        httpServer.close();
        serverApp.close();
        clientApp.dispose();
    })
});

