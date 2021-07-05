import { DataCollection } from "./DataCollection";
import { DataDocument } from "./DataDocument";
import { DriverResult } from "./DriverResult";

export interface IDataDriver {
    connect(): Promise<void>;
    getCollection(id: string): Promise<DriverResult>;
    getSubCollections(parentId: string): Promise<DriverResult>;
    createCollection(collection: DataCollection): Promise<DriverResult>;
    deleteCollection(id: string): Promise<DriverResult>;
    getDocument(id: string): Promise<DriverResult>;
    createDocument(doc: DataDocument): Promise<DriverResult>;
    updateDocument(id: string, data: any): Promise<DriverResult>;
    deleteDocument(id: string): Promise<DriverResult>;
    getDocuments(parentId: string): Promise<DriverResult>;
}