import { DataCollection, DataDocument, DriverResult } from "..";
import { QueryModel } from "../../realtime";
import { IDataDriver } from "../IDataDriver";
import * as sqlite3 from 'sqlite3';
import { v4 } from 'uuid';
import { SQLDataTypes } from "../SQLDataTypes";
export class SQLiteDriver implements IDataDriver {

    protected _db: sqlite3.Database;

    constructor(filename: string) {
        sqlite3.verbose(); // Debugging mode
        this._db = new sqlite3.Database(filename);
        this._db.on("error", (err) => {
            console.error(err);
        })
    }

    /**
     * Sử dụng cho các lệnh SQL không trả về giá trị
     */
    public sqliteRunAsync(command: string): Promise<sqlite3.RunResult> {
        return new Promise((resolve, reject) => {
            this._db.run(command, (result: sqlite3.RunResult, err: Error) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        })
    }
    /**
     * Sử dụng cho các lệnh SQL trả về giá trị
     */
    public sqliteReadAsync(command: string): Promise<Array<any>> {
        return new Promise((resolve, reject) => {
            let rows: any[] = [];
            this._db.each(command, (err: Error, row: any) => {
                if (err) {
                    console.log(err);
                    reject(err);
                    return;
                }
                rows.push(row);
            }, (err, count) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    async connect(): Promise<void> {
        await this.sqliteRunAsync(`CREATE TABLE IF NOT EXISTS 
        Collection (id TEXT, parentId NVARCHAR(255) , name NVARCHAR(255), 
        PRIMARY KEY(parentId,name))`);
        await this.sqliteRunAsync(`CREATE TABLE IF NOT EXISTS 
        Document (id TEXT, parentId NVARCHAR(255) , docKey NVARCHAR(255), 
        PRIMARY KEY(parentId,docKey));`);
        await this.sqliteRunAsync(`CREATE TABLE IF NOT EXISTS 
        DocumentValue (id TEXT, docId NVARCHAR(255) , path NVARCHAR(255), vType NVARCHAR(10), vString TEXT, 
        PRIMARY KEY(docId,path));`);
    }
    async getCollection(id: string): Promise<DriverResult> {
        try {
            let result = await this.sqliteReadAsync(`SELECT * FROM Collection WHERE Collection.id = '${id}'`)
            return {
                affected: 1,
                collection: <DataCollection>result[0],
                isError: false
            }
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err
            }
        }

    }
    async getSubCollections(parentId: string): Promise<DriverResult> {
        try {
            let result = await this.sqliteReadAsync(`SELECT * FROM Collection WHERE parentId = '${parentId}`)
            return {
                affected: 1,
                isError: false,
                collection: result[0]
            }
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err
            }
        }
    }
    async createCollection(collection: DataCollection): Promise<DriverResult> {
        try {
            await this.sqliteRunAsync(`INSERT INTO Collection VALUES ( '${collection.id}','${collection.parentId}', '${collection.name}')`);
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err
            }
        }
        return {
            affected: 1,
            isError: false
        }
    }

    async getCollectionsRecursive(parentId: string) {
        let result = await this.sqliteReadAsync(`
            WITH RECURSIVE
            subcollection(x) AS (
                VALUES('${parentId}')
                UNION ALL
                SELECT id FROM Collection, subcollection WHERE parentid = x
            )
            SELECT x FROM subcollection
        `);
        return result as Array<any> ?? [];
    }

    async deleteCollection(id: string): Promise<DriverResult> {
        try {
            let subcollectionIds = await (await this.getCollectionsRecursive(id)).map((v) => v.x);
            let docIds = [];
            // Get all chidren documents
            for (let subcollectionId of subcollectionIds) {
                let dIds = (await this.sqliteReadAsync(`SELECT id FROM Document WHERE parentId = ${subcollectionId}`) as Array<string>) ?? [];
                docIds.push(...dIds);
            }
            // Get all values of documents and delete them
            for (let docId of docIds) {
                await this.sqliteRunAsync(`DELETE FROM DocumentValue WHERE docId = '${docId}'`);
                await this.sqliteRunAsync(`DELETE FROM Document WHERE id = '${docId}'`);
            }
            // Delete all children documents

            for (let subcollectionId of subcollectionIds) {
                await this.sqliteRunAsync(`DELEET FROM Collection WHERE id='${subcollectionId}'`);
            }

            // Delete itself
            await this.sqliteRunAsync(`DELETE FROM Collection WHERE Collection.id = '${id}'`)

            return {
                affected: subcollectionIds.length + docIds.length,
                isError: false
            }
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err
            }
        }
    }


    parseValueFromRow(row: any): any {
        switch (row.vType) {
            case SQLDataTypes.String:
                return row.vString.toString();
            case SQLDataTypes.Boolean:
                return row.vString == "true";
            case SQLDataTypes.Number:
                return Number.parseFloat(row.vString);
            case SQLDataTypes.Array:
                return JSON.parse(row.vString);
            case SQLDataTypes.Object:
                return {}
        }
    }

    rebuildDataObject(row: any, data: any) {
        let current = data;
        let names = row.path.split('.');
        console.log(row);
        if (names.length == 1 && row.path != "" && row.vType != SQLDataTypes.Object) {
            current[row.path] = this.parseValueFromRow(row);
            return;
        }
        if (row.path == "") {
            return;
        }
        for (let i = 0; i < names.length; i++) {
            if (current[names[i]] == undefined) {
                if (i == names.length - 1) {
                    current[names[i]] = this.parseValueFromRow(row);
                    break;
                }
                current[names[i]] = {};
            }
            current = current[names[i]];
        }
    }

    async getDocument(id: string): Promise<DriverResult> {
        let docResult: DataDocument = {
            id: id,
            key: "",
            parentId: "",
            value: ""
        };
        try {
            let doc = (await this.sqliteReadAsync(`SELECT * FROM Document WHERE Document.id = '${id}'`))[0];
            docResult.key = doc.key;
            docResult.parentId = doc.parentId;
            let docValues = await this.sqliteReadAsync(`SELECT * FROM DocumentValue WHERE DocumentValue.docId = '${id}'`);
            let value = {};
            for (let docValue of docValues) {
                this.rebuildDataObject(docValue, value);
            }
            docResult.value = value;
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err
            }
        }
        return {
            affected: 1,
            isError: false,
            docs: [docResult]
        };
    }

    public destructObjectToRows(value: any): Array<any> {
        let rows: Array<any> = [];
        let nameStack = Object.keys(value).map((name) => { return { path: name, ref: value[name] } });
        while (nameStack.length > 0) {
            let { path, ref } = nameStack.pop() ?? { path: "", ref: "" };
            if (typeof ref == "object") {
                nameStack.push(...Object.keys(ref).map((n) => { return { path: path + '.' + n, ref: ref[n] } }));
                continue;
            }
            let row = { path: path, vString: ref.toString(), vType: SQLDataTypes.String };
            if (typeof ref == "boolean") {
                row.vType = SQLDataTypes.Boolean;
            }
            else if (typeof ref == "number") {
                row.vType = SQLDataTypes.Number;
            }
            else if (Array.isArray(ref)) {
                row.vType = SQLDataTypes.Array;
                row.vString = JSON.stringify(ref);
            }
            rows.push(row);
        }

        return rows;
    }

    public destructDocumentData(data: DataDocument): Array<any> {
        let rows: Array<any> = [];
        let row = { id: v4(), docId: data.id, path: '', vType: SQLDataTypes.String, vString: data.value.toString() }
        if (typeof data.value == "object") {
            row.vType = SQLDataTypes.Object;
            rows.push(...this.destructObjectToRows(data.value).map((r) => { return { ...r, id: v4(), docId: data.id } }));
        }
        else if (typeof data.value == "boolean") {
            row.vType = SQLDataTypes.Boolean;
        }
        else if (typeof data.value == "number") {
            row.vType = SQLDataTypes.Number;
        }
        else if (Array.isArray(data.value)) {
            row.vType = SQLDataTypes.Array;
            row.vString = JSON.stringify(data.value);
        }

        rows.push(row);

        return rows;
    }

    async createDocument(doc: DataDocument): Promise<DriverResult> {
        try {
            try {
                let existed = (await this.sqliteReadAsync(`SELECT id FROM Document WHERE parentId='${doc.parentId}' AND docKey='${doc.key}'`)).length != 0;
                if (existed) {
                    await this.deleteDocument(doc.id);
                }
                await this.sqliteRunAsync(`INSERT INTO Document VALUES ('${doc.id}','${doc.parentId}','${doc.key}')`);
            } catch (e) {

            }

            let rows = this.destructDocumentData(doc);
            for (let row of rows) {
                try {
                    await this.sqliteRunAsync(`INSERT INTO DocumentValue VALUES ('${row.id}', '${row.docId}','${row.path}', '${row.vType}', '${row.vString}'  )`)
                } catch (e) {
                    // await this.sqliteRunAsync(`UPDATE DocumentValue SET vType ='${row.vType}', vString= '${row.vString}' WHERE DocumentValue.docId = '${doc.id}'`);
                }
            }
            return {
                affected: 1,
                isError: false,
                docs: rows
            }
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err
            }
        }
    }
    async updateDocument(id: string, data: any): Promise<DriverResult> {
        try {
            let doc = (await this.sqliteReadAsync(`SELECT parentId,key FROM Document WHERE id = '${id}'`))[0];
            if (doc == undefined) {
                return {
                    affected: 0,
                    isError: false
                }
            }
            let result = await this.createDocument({
                id: id,
                parentId: doc.parentId,
                key: doc.key,
                value: data
            });
            if (result.isError) {
                throw result.error
            }
            return {
                affected: 1,
                isError: false
            }
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err
            }
        }
    }
    async deleteDocument(id: string): Promise<DriverResult> {
        try {
            await this.sqliteRunAsync(`DELETE FROM DocumentValue WHERE docId = '${id}'`);
            await this.sqliteRunAsync(`DELETE FROM Document WHERE id = '${id}'`);
            return {
                affected: 1,
                isError: false
            }
        } catch (e) {
            return {
                affected: 0,
                isError: true,
                error: e
            }
        }
    }
    async getDocuments(parentId: string): Promise<DriverResult> {
        try {
            let docs = new Array<DataDocument>();
            let Ids = (await this.sqliteReadAsync(`SELECT id FROM Document WHERE parentId = '${parentId}'`)).map((v) => v.id);
            for (let id of Ids) {
                let r = await this.getDocument(id);
                if (r.docs != undefined) {
                    let d = r.docs[0];
                    if (d != undefined) {
                        docs.push(d);
                    }
                }
            }
            return {
                affected: docs.length,
                isError: false,
                docs: docs
            }
        } catch (e) {
            return {
                affected: 0,
                isError: true,
                error: e
            }
        }
    }
    /**
     * [WIP]
     * @param parentId 
     * @param query 
     */
    queryDocuments(parentId: string, query: QueryModel): Promise<DriverResult> {
        let cmd = `SELECT Document.id FROM Document 
        JOIN DocumentValue 
        ON Document.id = DocumentValue.docId 
        WHERE parentId = '${parentId}' `;

        for (let filter of query.filters ?? []) {
            cmd += `INTERSECT
                    SELECT Document.id FROM Document 
                    JOIN DocumentValue 
                    ON Document.id = DocumentValue.docId 
                    WHERE parentId = '${parentId}' AND DocumentValue.path = '${filter.field}'
                                                AND DocumentValue.vString ${filter.op} ` + ((typeof filter.value == "string") ? `'${filter.value}'` : `${filter.value}`);
        }
        if (query.orderBy != undefined) {
            cmd += ` UNION ALL
                    SELECT Document.id, DocumentValue.vString FROM Document
                    JOIN DocumentValue
                    ON Document.id = DocumentValue.docId
                    WHERE parentId = '${parentId}' AND DocumentValue.path = '${query.orderBy.field}'`;

            cmd += ` INTERSECT
                    SELECT Document.id, DocumentValue.vString AS sorted FROM Document
                    JOIN DocumentValue
                    ON Document.id = DocumentValue.docId
                    WHERE DocumentValue.path = '${query.orderBy.field}' `;
            cmd += ` ORDER BY sorted '${query.orderBy.type}'`
        }
        if (query.limit != undefined) {
            cmd += ` LIMIT ${query.limit}  `
        }

    }

}