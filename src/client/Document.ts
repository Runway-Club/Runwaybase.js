import { ChangePayload, ChangeSnapshot, ChangeSubject, QueryCommand, QueryModel, QueryResult } from "../realtime";
import { AppConfig } from "./AppConfig";
import axios from "axios";
import { v4 } from 'uuid';
import { Observable, Subject } from "rxjs";
export class Document {
    constructor(protected _config: AppConfig, protected _subject: Subject<ChangeSnapshot>, protected _query: QueryModel, protected key: string, protected path: string) { }


    public async create(data: any): Promise<QueryResult> {
        try {
            let result = await axios.post(this._config.restEndpoint, {
                ...this._query,
                command: QueryCommand.Create,
                params: {
                    key: (this.key == "" ? v4() : this.key),
                    value: data
                }
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            if (result.status != 200) {
                throw result.statusText
            }
            return <QueryResult>result.data;
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err.message
            }
        }
    }

    public async update(data: any): Promise<QueryResult> {
        try {
            let result = await axios.post(this._config.restEndpoint, {
                ...this._query,
                command: QueryCommand.Update,
                params: {
                    key: this.key,
                    value: data
                }
            }, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
            if (result.status != 200) {
                throw result.statusText;
            }
            return <QueryResult>result.data;
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err.message
            }
        }
    }

    public async delete(): Promise<QueryResult> {
        try {
            let result = await axios.post(this._config.restEndpoint, {
                ...this._query,
                command: QueryCommand.Delete,
                params: {
                    key: this.key
                }
            });
            if (result.status != 200) {
                throw result.statusText
            }
            return <QueryResult>result.data
        } catch (err) {
            return {
                affected: 0,
                isError: true,
                error: err.message
            }
        }
    }

    public onChange(): Observable<ChangePayload> {
        let docSubject = new Subject<ChangePayload>();
        this._subject.subscribe((v) => {
            if (v.subject == ChangeSubject.Document && v.change.key == this.key && v.change.path == this.path) {
                docSubject.next(v.change);
            }
        })
        return docSubject.asObservable();
    }

}