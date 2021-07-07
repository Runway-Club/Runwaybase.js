import { Server, Socket } from 'socket.io';
import { Application } from 'express';
import { Collection } from '../realtime/Collection';
import { RealtimeDatabase } from '../realtime/RealtimeDatabase';
import { IDataDriver } from '../drivers/IDataDriver';
import { BaseNotifier } from '../realtime/BaseNotifier';
import { ChangeSnapshot, INotifier } from '../realtime/INotifier';
import { QueryModel } from '../realtime/QueryModel';

export class Runwaybase {


    private static _cache: Runwaybase;

    protected _realtimeDB!: RealtimeDatabase;
    protected _io!: Server;
    protected _httpServer!: Application;
    protected _notifier!: INotifier;

    private constructor() { }

    public static get App(): Runwaybase {
        if (this._cache == null) {
            this._cache = new Runwaybase();
        }
        return this._cache;
    }

    public get realtimeDatabase(): RealtimeDatabase {
        return this._realtimeDB;
    }

    public async initialize(io: Server, httpServer: Application, driver: IDataDriver) {

        await driver.connect();

        this._notifier = new BaseNotifier();

        this._io = io;
        this._httpServer = httpServer;

        this._realtimeDB = new RealtimeDatabase(driver, this._notifier);

        /**
         * Receives query from clients
         */
        this._httpServer.post("/runwaybase/realtime", async (req, res) => {
            let query = <QueryModel>req.body;
            let result = await this._realtimeDB.execute(query);
            res.send(result);
        });

        /**
         * Emits changes on data to clients
         */
        this._io.on("connection", (socket: Socket) => {
            this._notifier.onChange().subscribe(((snapshot: ChangeSnapshot) => {
                console.log(snapshot);
                socket.emit("runwaybase-change", JSON.stringify(snapshot));
            }).bind(this));
        });

    }

}