import { AppConfig } from "./AppConfig";

import { io, Socket } from 'socket.io-client';
import { } from 'axios';
import { RealtimeDatabase } from "./RealtimeDatabase";

export class Runwaybase {
    protected _config!: AppConfig;
    private _socket!: Socket;

    private _db!: RealtimeDatabase;

    constructor() { }

    public initialize(config: AppConfig) {
        this._config = config;
        //this._socket = io(this._config.ioEndpoint);
        let socket = io(this._config.ioEndpoint);
        this._db = new RealtimeDatabase(config, socket);
        this._db.init();
    }

    public get realtime() {
        return this._db;
    }

}