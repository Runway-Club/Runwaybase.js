import { expect } from 'chai';
import { Collection } from '../src/realtime/Collection';
import { MemoryDataDriver } from '../src/drivers/Mem/MemoryDataDriver';
import { BaseNotifier } from '../src/realtime/BaseNotifier';
import { RealtimeDatabase } from '../src/realtime/RealtimeDatabase';
import { QueryCommand, QueryResult } from '../src/realtime/QueryModel';

describe("Realtime Database tests", () => {
    let notifier = new BaseNotifier();
    let driver = new MemoryDataDriver();
    let db: RealtimeDatabase | null = null;
    beforeEach(async () => {
        await driver.connect();
        // Prepare test data
        await driver.createCollection({
            id: "ROOT",
            name: "",
            parentId: ""
        });
        await driver.createDocument({
            id: "000",
            key: "memo",
            parentId: "ROOT",
            value: "Hello, world"
        });
        await driver.createCollection({
            id: "users",
            name: "users",
            parentId: "ROOT"
        });
        await driver.createDocument({
            id: "001",
            key: "001",
            parentId: "users",
            value: "Teoflio"
        });
        // await driver.createDocument({
        //     id: "002",
        //     key: "002",
        //     parentId: "users",
        //     value: "Marek"
        // });
        db = new RealtimeDatabase(driver, notifier);
    });
    it("Travel to existed collection", async () => {
        let users = await db?.collectionTravel("users");
        expect(users instanceof Collection).to.be.true;
        if (users instanceof Collection) {
            expect(users.documents.length).to.be.equal(1);
        }
    });
    it("Travel to inexisted collections", async () => {
        let friends = await db?.collectionTravel("profiles/friends");
        expect(friends instanceof Collection).to.be.true;
        if (friends instanceof Collection) {
            await friends.createDocument("Teoflio", "friend-01");
            expect(friends.documents.length).to.be.equal(1);
        }
    });
    it("Execute: Get docs", async () => {
        let result = await db?.execute({
            collectionPath: "users",
            command: QueryCommand.Get
        });
        expect(result?.isError ?? true).to.be.false;
        expect(result?.docs?.length ?? 0).to.be.equal(1);
    });
    it("Execute: Get docs of inexisted collection", async () => {
        let result = await db?.execute({
            collectionPath: "users/profiles",
            command: QueryCommand.Get
        });
        expect(result?.isError ?? true).to.be.false;
        expect(result?.docs?.length ?? 0).to.be.equal(0);
    });

    it("Execute: Create docs", async () => {
        let result = await db?.execute({
            collectionPath: "profiles",
            command: QueryCommand.Create,
            params: {
                key: "profile-001",
                value: {
                    name: "Teoflio",
                    dob: 1998,
                    gpa: 3.99,
                    isMale: true
                }
            }
        });
        expect(result?.isError ?? true).to.be.false;
        let users = await db?.collectionTravel("profiles");
        if (users instanceof Collection) {
            expect(users.documents.length).to.be.equal(1);
            expect(users.documents[0].value['name']).to.be.equal("Teoflio")
        }
    });

    it("Execute: Update a doc", async () => {
        let result = await db?.execute({
            collectionPath: "users",
            command: QueryCommand.Update,
            params: {
                key: "001",
                value: {
                    name: "Teoflio",
                    dob: 1998,
                    gpa: 3.99,
                    isMale: true
                }
            }
        });
        expect(result?.isError ?? true).to.be.false;
        let users = await db?.collectionTravel("users");
        if (users instanceof Collection) {
            expect(users.documents[0].value['gpa']).to.be.equal(3.99)
        }
    });

    it("Execute: Update a doc of inexisted collection", async () => {
        let result = await db?.execute({
            collectionPath: "profiles/friends",
            command: QueryCommand.Update,
            params: {
                key: "001",
                value: {
                    name: "Teoflio",
                    dob: 1998,
                    gpa: 3.99,
                    isMale: true
                }
            }
        });
        expect(result?.isError ?? true).to.be.false;
        let users = await db?.collectionTravel("profiles/friends");
        if (users instanceof Collection) {
            expect(users.documents[0].value['gpa']).to.be.equal(3.99)
        }
    });

    it("Execute: Delete a document", async () => {
        let result = await db?.execute({
            collectionPath: "users",
            command: QueryCommand.Delete,
            params: {
                key: "001"
            }
        });
        expect(result?.isError ?? true).to.be.false;
        let users = await db?.collectionTravel("users");
        if (users instanceof Collection) {
            expect(users.documents.length).to.be.equal(0)
        }
    });

    it("Execute: Delete a collection", async () => {
        let result = await db?.execute({
            collectionPath: "",
            command: QueryCommand.Delete,
            params: {
                type: 'collection',
                name: "users"
            }
        });
        expect(result?.isError ?? true).to.be.false;
        let root = await db?.collectionTravel("");
        if (root instanceof Collection) {
            expect(root.subCollections.length).to.be.equal(0)
        }
    });

    it("Execute: Delete an inexisted document", async () => {
        let result = await db?.execute({
            collectionPath: "profiles",
            command: QueryCommand.Delete,
            params: {
                key: "xxx"
            }
        });
        expect(result?.isError ?? true).to.be.false;
        let users = await db?.collectionTravel("profiles");
        if (users instanceof Collection) {
            expect(users.documents.length).to.be.equal(0)
        }
    });

});