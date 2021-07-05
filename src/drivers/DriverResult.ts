import { DataCollection } from "./DataCollection";
import { DataDocument } from "./DataDocument";

export interface DriverResult {
    affected: number,
    subCollections?: DataCollection[]
    collection?: DataCollection,
    docs?: DataDocument[],
    isError: boolean,
    error?: string
}