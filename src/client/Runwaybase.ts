import { AppConfig } from "./AppConfig";

import { io, Socket } from 'socket.io-client';
import { } from 'axios';
import { RealtimeDatabase } from "./RealtimeDatabase";

export class Runwaybase {
    protected _config!: AppConfig;

    private _db!: RealtimeDatabase;

    private socket!: Socket;

    constructor() { }

    public initialize(config: AppConfig) {
        this._config = config;
        let socket = io(this._config.ioEndpoint);

        this._db = new RealtimeDatabase(config, socket);
        this._db.init();
        this.socket = socket;
    }

    public get realtime() {
        return this._db;
    }

    public dispose(): void {
        this.socket?.close();
    }

}