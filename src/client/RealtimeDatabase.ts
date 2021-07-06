import { BehaviorSubject, Subject } from "rxjs";
import { Socket } from "socket.io-client";
import { ChangeSnapshot, ChangeSubject, ChangeType, QueryCommand } from "../realtime";
import { AppConfig } from "./AppConfig";
import { Collection } from "./Collection";

export class RealtimeDatabase {

    protected _subject: BehaviorSubject<ChangeSnapshot> = new BehaviorSubject(<ChangeSnapshot>{});
    protected _root: Collection = new Collection(this.config, this._subject, "", { collectionPath: "", command: QueryCommand.Get });

    constructor(protected config: AppConfig, protected socket: Socket) { }

    public init() {
        this.socket.on("runwaybase-change", (change) => {
            let data = <ChangeSnapshot>(JSON.parse(change));
            this._subject.next(data);
        });
    }

    public get db(): Collection {
        return this._root;
    }
}