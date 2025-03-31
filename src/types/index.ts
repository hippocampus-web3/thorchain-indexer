import { z } from 'zod';

export const TemplateSchema = z.object({
  address: z.string(),
  prefix: z.array(z.string()),
  table: z.string(),
  columns: z.record(z.string(), z.string()),
  parser: z.string()
});

export type Template = z.infer<typeof TemplateSchema>;

export interface IndexerState {
  id: number;
  address: string;
  lastBlock: number;
  lastUpdated: Date;
}

export interface MidgardAction {
  height: number;
  type: string;
  date: string;
  pools: string[];
  status: string;
  metadata: {
    send: {
      memo: string
    }
  };
  in: Array<{
    addresses: string[];
    txID: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
  }>;
  out: Array<{
    addresses: string[];
    txID: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
  }>;
}

export interface MidgardResponse {
  actions: MidgardAction[];
  count: number;
  meta: {
    nextPageToken: string;
  };
} 