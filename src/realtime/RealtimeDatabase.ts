import { Collection } from "./Collection";
import { IDataDriver } from "../drivers/IDataDriver";
import { INotifier } from "./INotifier";
import { v4 } from 'uuid';
import { QueryCommand, QueryModel, QueryResult } from "./QueryModel";
export class RealtimeDatabase {

    protected _root!: Collection;

    constructor(protected driver: IDataDriver, protected notifier: INotifier) {
        this._root = new Collection(driver, notifier, "", "", "ROOT", "");
        this._root.fetch(true);
    }

    public async collectionTravel(collectionPath: string) {
        let collectionNames = collectionPath.split("/");
        let current = this._root;
        for (let collectionName of collectionNames) {
            await current.fetch();
            if (collectionName == "") {
                continue;
            }
            let colId = current.subCollections.findIndex((c) => c.name == collectionName);
            if (colId == -1) {
                let error = await current.createSubcollection(collectionName);
                if (error) {
                    return error;
                }
            }
            colId = current.subCollections.findIndex((c) => c.name == collectionName);
            current = current.subCollections[colId];
        }
        await current.fetch(true);
        return current;
    }

    public async execute(query: QueryModel): Promise<QueryResult> {
        let { key, value, type, name } = query.params ?? {};
        let result;
        let des = await this.collectionTravel(query.collectionPath);
        if (des instanceof Error) {
            return {
                affected: 0,
                isError: true,
                error: des.message
            }
        }
        switch (query.command) {
            case QueryCommand.Get:
                // Load documents lazily
                // if (query.filters == undefined || query.filters.length == 0) {
                //     await des.fetch(true);
                // }
                if (type == 'collection') {
                    let collection = await this.collectionTravel(query.collectionPath);
                    if (collection instanceof Collection) {
                        return {
                            affected: 1,
                            collections: [collection],
                            isError: false
                        }
                    } else {
                        return {
                            affected: 0,
                            isError: true,
                            error: collection.message
                        }
                    }

                }
                return {
                    affected: des.documents.length + des.subCollections.length,
                    collections: des.subCollections,
                    docs: des.documents,
                    isError: false
                }

            case QueryCommand.Create:

                result = await des.createDocument(value ?? 0, key ?? v4());
                if (result instanceof Error) {
                    return {
                        affected: 0,
                        isError: true,
                        error: result.message
                    };
                }
                des.fetch(true);
                return {
                    affected: 1,
                    isError: false,
                }

            case QueryCommand.Update:

                result = await des.updateDocument(value ?? 0, key ?? v4());
                if (result instanceof Error) {
                    return {
                        affected: 0,
                        isError: true,
                        error: result.message
                    };
                }
                des.fetch(true);
                return {
                    affected: 1,
                    isError: false,
                }

            case QueryCommand.Delete:

                if (type == 'collection') {
                    result = await des.deleteSubcollection(name ?? "");
                    des.fetch(true);
                    return {
                        affected: (result instanceof Error) ? 0 : 1,
                        isError: false
                    }
                }
                else {
                    result = await des.deleteDocument(key);
                    des.fetch(true);
                    return {
                        affected: (result instanceof Error) ? 0 : 1,
                        isError: false
                    }
                }
        }

    }

}