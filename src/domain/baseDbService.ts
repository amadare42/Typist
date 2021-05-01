import { AppDbSchema, dbPromise } from './db';
import { IDBPDatabase } from 'idb';

export class BaseDbService {
    private rqPromise: Promise<any>;

    protected async getDb() {
        const db = await dbPromise;
        await this.rqPromise;
        return db;
    }

    protected async doRq<T>(perform: (rq: IDBPDatabase<AppDbSchema>) => Promise<T>) {
        const db = await this.getDb();
        this.rqPromise = perform(db);
        return this.rqPromise as Promise<T>;
    }
}
