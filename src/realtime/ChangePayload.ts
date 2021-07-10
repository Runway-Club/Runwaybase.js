import { DataDocument } from "../drivers";

export interface ChangePayload {
  collectionId: string;
  path: string;
  key?: string;
  value?: any;
  docs?: DataDocument[];
}
