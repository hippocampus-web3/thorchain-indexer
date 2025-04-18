import { z } from 'zod';

export const TemplateSchema = z.object({
  address: z.string(),
  prefix: z.array(z.string()),
  table: z.string(),
  parser: z.string(),
  minAmount: z.number()
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
    address: string;
    txID: string;
    coins: Array<{
      asset: string;
      amount: string;
    }>;
  }>;
  out: Array<{
    address: string;
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