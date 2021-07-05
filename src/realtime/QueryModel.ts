import { DataCollection } from "../drivers/DataCollection";
import { DataDocument } from "../drivers/DataDocument";

export enum QueryCommand {
    Get,
    Create,
    Update,
    Delete
}

export enum QueryOperator {
    EQ,
    IEQ,
    LT,
    LTE,
    GT,
    GTE
}

export interface QueryFilter {
    field: string,
    op: QueryOperator,
    value: any
}

export interface QueryModel {
    command: QueryCommand,
    collectionPath: string,
    params?: any,
    filters?: QueryFilter[]
}

export interface QueryResult {
    affected: number,
    collections?: DataCollection[]
    docs?: DataDocument[]
    isError: boolean,
    error?: string
}