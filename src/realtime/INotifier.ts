import { Observable } from "rxjs";
import { ChangePayload } from "./ChangePayload";

export enum ChangeSubject {
    Collection,
    Document
}

export enum ChangeType {
    Added,
    Updated,
    Deleted
}

export interface ChangeSnapshot {
    subject: ChangeSubject,
    type: ChangeType,
    change: ChangePayload
}

export interface INotifier {
    notify(subject: ChangeSubject, type: ChangeType, change: ChangePayload): void;
    onChange(): Observable<ChangeSnapshot>;
}