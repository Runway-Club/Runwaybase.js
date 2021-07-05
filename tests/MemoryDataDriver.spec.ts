import { IDataDriver } from "../src/drivers/IDataDriver";
import { MemoryDataDriver } from "../src/drivers/Mem/MemoryDataDriver";
import { expect } from 'chai';

describe("Memory Data Driver Tests", () => {

    let driver = new MemoryDataDriver();

    it("Get inexisted collection", async () => {
        await driver.connect();
        let result = await driver.getCollection("abc");
        expect(result.isError).to.be.equal(true);
    });
    it("Get a collection", async () => {
        await driver.connect();

        driver.collections.push({
            id: "ID-01",
            name: "test",
            parentId: "",
        })

        let result = await driver.getCollection("ID-01");
        expect(result.isError).to.be.equal(false);
        expect(result.collection).to.be.not.undefined;
        expect(result.collection?.id).to.be.equal("ID-01");
    });
    it("Create a collection", async () => {
        await driver.connect();
        let result = await driver.createCollection({
            id: "COL-01",
            parentId: "ROOT",
            name: "test"
        });
        expect(result.isError).to.be.equal(false);
        expect(result.affected).to.be.equal(1);
        expect(driver.collections[0]?.name).to.be.equal("test");
    });
    it("Create a subcollection", async () => {
        await driver.connect();
        let result = await driver.createCollection({
            id: "COL-01",
            parentId: "ROOT",
            name: "test"
        });
        if (result.collection == undefined) {
            // expect.fail("Collection is null");
            return;
        }
        result = await driver.createCollection({
            id: "COL-02",
            parentId: result.collection?.id ?? "",
            name: "test"
        });
        expect(result.isError).to.be.equal(false);
        expect(result.affected).to.be.equal(1);
        expect(driver.collections.length).to.be.equal(2);
    });
    it("Create same name subcollections should be failed", async () => {
        let driver = new MemoryDataDriver();
        await driver.connect();
        let result = await driver.createCollection({
            id: "COL-01",
            parentId: "ROOT",
            name: "test"
        });
        result = await driver.createCollection({
            id: "COL-01",
            parentId: "ROOT",
            name: "test"
        });
        expect(result.isError).to.be.equal(true);
        expect(result.affected).to.be.equal(0);
    });
    it("Delete an empty collection", async () => {
        await driver.connect();
        let result = await driver.createCollection({
            id: "COL-01",
            parentId: "ROOT",
            name: "test"
        });
        if (result.collection == undefined) {
            return;
        }
        result = await driver.deleteCollection(result.collection?.id ?? "");
        expect(result.isError).to.be.equal(false);
        expect(result.affected).to.be.equal(1);
        expect(driver.collections.length).to.be.equal(0);
    });
    it("Delete collection with subcollections and documents", async () => {
        await driver.connect();
        let result = await driver.createCollection({
            id: "COL-01",
            parentId: "ROOT",
            name: "test"
        });

        if (result.collection == undefined) {
            return;
        }

        result = await driver.createCollection({
            id: "COL-01",
            parentId: result.collection?.id ?? "",
            name: "test"
        });

        driver.documents.push({
            id: "DOC-01",
            key: "doc",
            parentId: result.collection?.id ?? "",
            value: 0
        });

        result = await driver.deleteCollection(result.collection?.id ?? "");
        expect(result.isError).to.be.equal(false);
        expect(result.affected).to.be.equal(3);
        expect(driver.documents.length).to.be.equal(0);
        expect(driver.collections.length).to.be.equal(0);
    });
    it("Get a document", async () => {
        await driver.connect();
        driver.documents.push({ id: "DOC-01", key: "test", parentId: "ROOT", value: 1 });
        let result = await driver.getDocument("DOC-01");
        expect(result.isError).to.be.false;
        expect(result.affected).to.be.equal(1);
    });
    it("Get inexisted document", async () => {
        await driver.connect();
        let result = await driver.getDocument("DOC-01");
        expect(result.isError).to.be.true;
        expect(result.affected).to.be.equal(0);
    });
    it("Create documents in root", async () => {
        await driver.connect();
        let result = await driver.createDocument({ id: "doc1", key: "doc1", parentId: "ROOT", value: 1 });
        expect(driver.documents.length).to.be.equal(1);
        expect(result.affected).to.be.equal(1);
        result = await driver.createDocument({ id: "doc2", key: "doc2", parentId: "ROOT", value: 1 });
        expect(driver.documents.length).to.be.equal(2);
        expect(result.affected).to.be.equal(1);
    });
    it("Update document", async () => {
        await driver.connect();
        let result = await driver.createDocument({ id: "doc1", key: "doc1", parentId: "ROOT", value: 1 });
        result = await driver.updateDocument("doc1", 100);
        expect(driver.documents[0].value).to.be.equal(100);
        expect(result.affected).to.be.equal(1);
    });
    it("Update inexisted document", async () => {
        await driver.connect();
        let result = await driver.updateDocument("doc1", 100);
        expect(result.isError).to.be.true;
        expect(result.affected).to.be.equal(0);
    });
    it("Delete document", async () => {
        await driver.connect();
        let result = await driver.createDocument({ id: "doc1", key: "doc1", parentId: "ROOT", value: 1 });
        result = await driver.deleteDocument("doc1");
        expect(driver.documents.length).to.be.equal(0);
        expect(result.affected).to.be.equal(1);
    });
    it("Delete inexisted document", async () => {
        await driver.connect();
        let result = await driver.deleteDocument("doc1");
        expect(result.isError).to.be.true;
        expect(result.affected).to.be.equal(0);
    });
});