import { DataCollection } from "../DataCollection";
import { DataDocument } from "../DataDocument";
import { DriverResult } from "../DriverResult";
import { IDataDriver } from "../IDataDriver";
import { v4 } from "uuid";
import { QueryModel, QueryOperator, QueryOrder } from "../../realtime";
import { filter } from "rxjs/operators";

export class MemoryDataDriver implements IDataDriver {
    protected _collections: DataCollection[] = [];
    protected _documents: DataDocument[] = [];

    public get collections() {
        return this._collections;
    }

    public get documents() {
        return this._documents;
    }

    connect(): Promise<void> {
        this._collections = [];
        this._documents = [];
        return Promise.resolve();
    }

    getCollection(id: string): Promise<DriverResult> {
        let selectedId = this._collections.findIndex((c) => c.id == id);
        if (selectedId == -1) {
            return Promise.resolve({
                affected: 0,
                isError: true,
                error: `Collection [${id}] not found`,
            });
        }
        return Promise.resolve({
            affected: 1,
            isError: false,
            collection: this._collections[selectedId],
        });
    }

    async createCollection(collection: DataCollection): Promise<DriverResult> {
        let dupId = this._collections.findIndex(
            (c) => c.parentId == collection.parentId && c.name == collection.name
        );
        if (dupId > -1) {
            return {
                affected: 0,
                isError: true,
                error: `Duplicated collection [${collection.name}]`,
            };
        }
        this._collections.push(collection);
        return {
            affected: 1,
            collection: collection,
            isError: false,
        };
    }
    deleteCollection(id: string): Promise<DriverResult> {
        let deletedStack = [id];
        let deletedCount = 0;
        while (deletedStack.length > 0) {
            let currentDeletedId = deletedStack.pop();
            let collectionPos = this._collections.findIndex(
                (c) => c.id == currentDeletedId
            );
            if (collectionPos == -1) {
                continue;
            }
            let deleted = this._collections[collectionPos];
            // Get all its subcollections
            deletedStack.push(
                ...this._collections
                    .filter((c) => c.parentId == deleted.id)
                    .map((c) => c.id)
            );
            // Delete all its docs
            let deletedDocIds = this._documents
                .filter((d) => d.parentId == deleted.id)
                .map((d) => d.id);
            for (let docId of deletedDocIds) {
                let deletedDocId = this._documents.findIndex((d) => d.id == docId);
                if (deletedDocId == -1) {
                    continue;
                }
                this._documents.splice(deletedDocId, 1);
                deletedCount++;
            }
            // Delete itself
            this._collections.splice(collectionPos, 1);
            deletedCount++;
        }
        return Promise.resolve({
            affected: deletedCount,
            isError: false,
        });
    }
    getDocument(id: string): Promise<DriverResult> {
        let selectedId = this._documents.findIndex((d) => d.id == id);
        if (selectedId == -1) {
            return Promise.resolve({
                affected: 0,
                isError: true,
                error: `Document [${id}] not found`,
            });
        }
        return Promise.resolve({
            affected: 1,
            docs: [this._documents[selectedId]],
            isError: false,
        });
    }
    createDocument(doc: DataDocument): Promise<DriverResult> {
        let dupId = this._documents.findIndex(
            (d) => d.key == doc.key && d.parentId == doc.parentId
        );
        if (dupId > -1) {
            return Promise.resolve({
                affected: 0,
                isError: true,
                error: `Duplicated doc [${doc.key}] in [${doc.parentId}]`,
            });
        }
        this._documents.push(doc);
        return Promise.resolve({
            affected: 1,
            isError: false,
        });
    }
    updateDocument(id: string, data: any): Promise<DriverResult> {
        let docId = this._documents.findIndex((d) => d.id == id);
        if (docId == -1) {
            return Promise.resolve({
                affected: 0,
                isError: true,
                error: `Document [${id}] not found`,
            });
        }
        this._documents[docId].value = data;
        return Promise.resolve({
            affected: 1,
            isError: false,
        });
    }
    deleteDocument(id: string): Promise<DriverResult> {
        let deletedId = this._documents.findIndex((d) => d.id == id);
        if (deletedId == -1) {
            return Promise.resolve({
                affected: 0,
                isError: true,
                error: `Document [${id}] not found`,
            });
        }
        this._documents.splice(deletedId, 1);
        return Promise.resolve({
            affected: 1,
            isError: false,
        });
    }

    getDocuments(parentId: string): Promise<DriverResult> {
        let docs = this._documents.filter((d) => d.parentId == parentId);
        return Promise.resolve({
            affected: docs.length,
            docs: docs,
            isError: false,
        });
    }

    getSubCollections(parentId: string): Promise<DriverResult> {
        let subCollections = this._collections.filter(
            (c) => c.parentId == parentId
        );
        return Promise.resolve({
            affected: subCollections.length,
            subCollections: subCollections,
            isError: false,
        });
    }

    protected getValueFromObject(id: string, obj: any, keyPath: string): any {
        if (keyPath == "$id") {
            return id;
        }
        let current = obj;
        let keys = keyPath.split('.');
        for (let key of keys) {
            if (current == undefined) {
                return null;
            }
            current = current[key];
        }
        return current;
    }

    queryDocuments(parentId: string, query: QueryModel): Promise<DriverResult> {

        let selectedDocs = this._documents.filter((d) => d.parentId == parentId);
        let resultDocs = [];
        for (let filter of query.filters ?? []) {
            for (let doc of selectedDocs) {
                let fieldValue = null;
                let secondValue = filter.value;
                fieldValue = this.getValueFromObject(doc.id, filter.field, doc.value);
                if (filter.opAsKey ?? false) {
                    secondValue = this.getValueFromObject(doc.id, filter.value, doc.value);
                }
                switch (filter.op) {
                    case QueryOperator.EQ:
                        if (fieldValue === secondValue) {
                            resultDocs.push(doc);
                        }
                        break;
                    case QueryOperator.IEQ:
                        if (fieldValue !== secondValue) {
                            resultDocs.push(doc);
                        }
                        break;
                    case QueryOperator.LT:
                        if (fieldValue < secondValue) {
                            resultDocs.push(doc);
                        }
                        break;
                    case QueryOperator.LTE:
                        if (fieldValue <= secondValue) {
                            resultDocs.push(doc);
                        }
                        break;
                    case QueryOperator.GT:
                        if (fieldValue > secondValue) {
                            resultDocs.push(doc);
                        }
                        break;
                    case QueryOperator.GTE:
                        if (fieldValue >= secondValue) {
                            resultDocs.push(doc);
                        }
                        break;
                    case QueryOperator.IN:
                        if (Array.isArray(fieldValue)) {
                            if (fieldValue.includes(secondValue)) {
                                resultDocs.push(doc);
                            }
                        }
                        break;
                    case QueryOperator.NIN:
                        if (Array.isArray(fieldValue)) {
                            if (!fieldValue.includes(secondValue)) {
                                resultDocs.push(doc);
                            }
                        }
                        break;
                }
            }
        }

        if (query.orderBy != undefined) {
            resultDocs.sort((d1, d2) => {
                let v1 = this.getValueFromObject(d1.id, d1.value, query.orderBy?.field ?? "");
                let v2 = this.getValueFromObject(d2.id, d2.value, query.orderBy?.field ?? "");
                let f = (query.orderBy?.type == QueryOrder.Ascending) ? 1 : -1;
                if (v1 == v2) {
                    return 0;
                }
                else if (v1 > v2) {
                    return f;
                }
                return -f;
            });

        }

        if (query.limit != undefined) {
            if (resultDocs.length > query.limit) {
                resultDocs = resultDocs.slice(0, query.limit)
            }
        }

        return Promise.resolve({
            affected: resultDocs.length,
            docs: resultDocs,
            isError: false,
        });
    }
}
