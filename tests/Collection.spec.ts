import { expect } from 'chai';
import { BaseNotifier } from '../src/realtime/BaseNotifier';
import { MemoryDataDriver } from '../src/drivers/Mem/MemoryDataDriver';
import { Collection } from '../src/realtime/Collection';

describe("Collection tests", () => {
    let notifier = new BaseNotifier();
    let driver = new MemoryDataDriver();
    beforeEach(async function () {
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
        await driver.createDocument({
            id: "002",
            key: "002",
            parentId: "users",
            value: "Marek"
        });
    });
    it("Fetch with documents", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        expect(collection.subCollections.length).to.be.equal(1);
        expect(collection.documents.length).to.be.equal(1);
    });
    it("Fetch all subcollections and documents", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        collection = collection.subCollections[0];
        await collection.fetch(true)
        expect(collection.subCollections.length).to.be.equal(0);
        expect(collection.documents.length).to.be.equal(2);
        expect(collection.documents[0].value).to.be.equal("Teoflio");
    });

    // it("Fetch all subcollections and documents", async () => {
    //     let collection = new Collection(driver, notifier, "", "ROOT", "");

    // });

    it("Create a subcollection", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        await collection.createSubcollection("profiles");
        expect(collection.subCollections.length).to.be.equal(2);

    });

    it("Delete a subcollection", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        await collection.deleteSubcollection("users");
        expect(collection.subCollections.length).to.be.equal(0);
        //expect().to.be.true;
    });

    it("Create a document", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        await collection.createDocument(1998, "dob");
        expect(collection.documents.length).to.be.equal(2);
    });

    it("Create a duplicated document", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        await collection.createDocument(1998, "memo");
        expect(collection.documents[0].value).to.be.equal(1998);
    });

    it("Update a document", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        await collection.updateDocument(1998, "memo");
        expect(collection.documents[0].value).to.be.equal(1998);
    });


    it("Update an inexisted document", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        await collection.updateDocument(1998, "dob");
        expect(collection.documents.findIndex((d) => d.key == "dob")).to.be.greaterThan(-1);
    });

    it("Delete a document", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        await collection.deleteDocument("memo");
        expect(collection.documents.length).to.be.equal(0);
    });

    it("Delete an inexisted document", async () => {
        let collection = new Collection(driver, notifier, "", "ROOT", "");
        await collection.fetch(true);
        await collection.deleteDocument("dob");
        expect(collection.documents.length).to.be.equal(1);
    });


});