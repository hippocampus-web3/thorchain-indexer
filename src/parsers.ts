import { MidgardAction } from './types';

export interface ParserResult {
  [key: string]: any;
}

export const parsers = {
  nodeListing: (action: MidgardAction): ParserResult => {
    const memo = action.metadata.send.memo;

    const parts = memo.split(':');
    if (parts.length !== 7) {
      throw new Error(`Invalid memo format for node listing: ${memo}`);
    }

    return {
      nodeAddress: parts[2],
      operatorAddress: parts[3],
      minRune: Number(parts[4]),
      maxRune: Number(parts[5]),
      feePercentage: Number(parts[6]),
      txId: action.in[0]?.txID,
      height: action.height,
      timestamp: new Date(action.date)
    };
  },
  whitelistRequest: (action: MidgardAction) => {
    const memo = action.metadata.send.memo;

    const parts = memo.split(':').slice(1);
    if (parts.length !== 5) {
      throw new Error(`Invalid memo format for node listing: ${memo}`);
    }

    return {
        nodeAddress: parts[2],
        userAddress: parts[3],
        intendedBondAmount: parseInt(parts[4]),
        txId: action.in[0].txID,
        height: action.height,
        timestamp: new Date(action.date)
    };
  } 
};

export type ParserFunction = (action: MidgardAction) => ParserResult;
export type ParserMap = Record<string, ParserFunction>;

export function getParser(parserName: string): ParserFunction {
  const parser = (parsers as ParserMap)[parserName];
  if (!parser) {
    throw new Error(`Parser ${parserName} not found`);
  }
  return parser;
} 