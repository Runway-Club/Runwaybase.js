import { DataCollection, DataDocument } from "../drivers";
import {
    ChangePayload,
    ChangeSnapshot,
    ChangeSubject,
    ChangeType,
    QueryCommand,
    QueryModel,
    QueryOperator,
    QueryOrder,
    QueryResult,
} from "../realtime";
import axios from "axios";
import { AppConfig } from "./AppConfig";
import { v4 } from "uuid";
import { Document } from "./Document";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";

export enum DataEvent {
    Added,
    Updated,
    Deleted,
}

export class Collection {
    constructor(
        protected _config: AppConfig,
        protected _subject: Subject<ChangeSnapshot>,
        protected _path: string,
        protected _query: QueryModel
    ) { }
    public get query() {
        return this._query;
    }

    private join(...paths: string[]): string {
        let current = "";
        let result = "";
        for (let i = 0; i < paths.length; i++) {
            current = paths[i];
            if (current[0] == "/") {
                current = current.substring(1);
            }
            if (current[current.length - 1] == "/") {
                current = current.substring(0, current.length - 1);
            }
            result += current + "/";
        }
        if (result[0] == "/") {
            result = result.substring(1);
        }
        if (result[result.length - 1] == "/") {
            result = result.substring(0, result.length - 1);
        }
        return result;
    }

    public collection(collectionPath: string): Collection {
        let query = {
            ...this._query,
            collectionPath: this.join(this._query.collectionPath, collectionPath),
        };
        if (query.collectionPath[0] == "/") {
            query.collectionPath = query.collectionPath.substring(1);
        }
        return new Collection(this._config, this._subject, collectionPath, query);
    }

    public doc(key?: string): Document {
        if (this._path[0] == "/") {
            this._path = this._path.substring(1);
        }
        return new Document(
            this._config,
            this._subject,
            this._query,
            key ?? "",
            this._path
        );
    }

    public docs(): Observable<DataDocument[]> {
        let docsSubject: Subject<DataDocument[]> = new Subject<DataDocument[]>();

        axios
            .post(this._config.restEndpoint, {
                command: QueryCommand.Get,
                collectionPath: this._query.collectionPath,
            })
            .then((res) => {
                docsSubject.next((<QueryResult>res.data).docs ?? []);
            })
            .catch((err) => {
                // console.error(err);
            });

        this._subject.subscribe(async (v) => {
            // console.log(v);
            if (v.change == undefined) {
                return;
            }
            if (v.change.path[0] == "/") {
                v.change.path = v.change.path.substring(1);
            }
            if (v.change.path == this._path) {
                let res = await axios.post(this._config.restEndpoint, {
                    command: QueryCommand.Get,
                    collectionPath: this._query.collectionPath,
                });

                docsSubject.next((<QueryResult>res.data).docs ?? []);
            }
        });
        return docsSubject.asObservable();
    }

    public onSnapshot(
        event: DataEvent = DataEvent.Added
    ): Observable<ChangePayload> {
        let docSubject = new Subject<ChangePayload>();
        switch (event) {
            case DataEvent.Added:
                this._subject.subscribe((v) => {
                    if (v.change == undefined) {
                        return;
                    }
                    if (
                        v.subject == ChangeSubject.Document &&
                        v.type == ChangeType.Added &&
                        v.change.path == this._path
                    ) {
                        docSubject.next(v.change);
                    }
                });
                break;

            case DataEvent.Updated:
                this._subject.subscribe((v) => {
                    if (v.change == undefined) {
                        return;
                    }
                    if (
                        v.subject == ChangeSubject.Document &&
                        v.type == ChangeType.Updated &&
                        v.change.path == this._path
                    ) {
                        docSubject.next(v.change);
                    }
                });
                break;

            case DataEvent.Deleted:
                this._subject.subscribe((v) => {
                    if (v.change == undefined) {
                        return;
                    }
                    if (
                        v.subject == ChangeSubject.Document &&
                        v.type == ChangeType.Deleted &&
                        v.change.path == this._path
                    ) {
                        docSubject.next(v.change);
                    }
                });
                break;
        }
        return docSubject.asObservable();
    }

    public async deleteSubcollection(name: string): Promise<QueryResult> {
        let result = await axios.post(
            this._config.restEndpoint,
            {
                ...this._query,
                command: QueryCommand.Delete,
                params: {
                    name: name,
                    type: "collection",
                },
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        if (result.status != 200) {
            throw result.statusText;
        }
        return <QueryResult>result.data;
    }
    /**
     *
     */
    public where(
        fieldName: string,
        operator: QueryOperator,
        value: any
    ): Collection {
        return new Collection(this._config, this._subject, this._path, {
            ...this._query,
            filters: [
                ...(this._query.filters ?? []),
                {
                    field: fieldName,
                    op: operator,
                    value: value,
                },
            ],
        });
    }

    public orderBy(fieldName: string, order: QueryOrder): Collection {
        return new Collection(this._config, this._subject, this._path, {
            ...this._query,
            orderBy: {
                field: fieldName,
                type: order,
            },
        });
    }

    public limit(quantity: number): Collection {
        return new Collection(this._config, this._subject, this._path, {
            ...this._query,
            limit: quantity,
        });
    }

    public execute(): Observable<DataDocument[]> {
        let docs = new Subject<DataDocument[]>();

        this._subject.subscribe((v) => {
            if (v.change == undefined) {
                return;
            }
            if (v.change.path == this._path) {
                axios.post(
                    this._config.restEndpoint,
                    {
                        ...this._query,
                        command: QueryCommand.Query,
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );
            }
            if (v.change.path == this._path && v.type == ChangeType.Query) {
                docs.next(v.change.docs ?? []);
            }
        });

        return docs.asObservable();
    }
}
