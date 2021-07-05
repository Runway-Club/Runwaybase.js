import { Observable, Subject } from "rxjs";
import { ChangePayload } from "./ChangePayload";
import { ChangeSnapshot, ChangeSubject, ChangeType, INotifier } from "./INotifier";

export class BaseNotifier implements INotifier {

    private change$: Subject<ChangeSnapshot> = new Subject();

    onChange(): Observable<ChangeSnapshot> {
        return this.change$.asObservable();
    }

    notify(subject: ChangeSubject, type: ChangeType, change: ChangePayload): void {
        this.change$.next({
            subject: subject,
            type: type,
            change: change
        });
        console.log(`Subject : ${subject} ; ${type}; ${JSON.stringify(change)}`);
    }

}