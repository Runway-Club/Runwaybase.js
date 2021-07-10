import { DataCollection } from "../drivers/DataCollection";
import { DataDocument } from "../drivers/DataDocument";

export enum QueryCommand {
    Get,
    Create,
    Update,
    Delete,
    Query,
}

/**
 * Các toán tử truy vấn
 */
export enum QueryOperator {
    /**
     * field bằng value?
     */
    EQ = "=",
    /**
     * field không bằng value?
     */
    IEQ = "<>",
    /**
     * field nhỏ hơn value?
     */
    LT = "<",
    /**
     * field nhỏ hơn hoặc bằng value?
     */
    LTE = "<=",
    /**
     * field lớn hơn value?
     */
    GT = ">",
    /**
     * field lớn hơn hoặc bằng value?
     */
    GTE = ">=",
    /**
     * value có trong mảng field?
     */
    IN = "IN",
    /**
     * value không có trong mảng field?
     */
    NIN = "NOT IN",
}
export enum QueryOrder {
    ASC,
    DESC,
}

export interface QueryOrderBy {
    field: string;
    type: QueryOrder;
}
export interface QueryFilter {
    field: string;
    op: QueryOperator;
    value: any;
    opAsKey?: boolean
}

export interface QueryModel {
    command: QueryCommand;
    collectionPath: string;
    params?: any;
    filters?: QueryFilter[];
    orderBy?: QueryOrderBy;
    limit?: number;
}

export interface QueryResult {
    affected: number;
    collections?: DataCollection[];
    docs?: DataDocument[];
    isError: boolean;
    error?: string;
}
