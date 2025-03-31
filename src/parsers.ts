import { MidgardAction } from './types';

export interface ParserResult {
  [key: string]: any;
}

export const parsers = {
  nodeListing: (action: MidgardAction): ParserResult => {
    const memo = action.metadata.send.memo;
    if (!memo.startsWith('TB:')) {
      throw new Error(`Invalid memo format for node listing: ${memo}`);
    }

    const parts = memo.split(':');
    if (parts.length !== 6) {
      throw new Error(`Invalid memo format for node listing: ${memo}`);
    }

    return {
      nodeAddress: parts[1],
      operatorAddress: parts[2],
      minRune: Number(parts[3]),
      maxRune: Number(parts[4]),
      feePercentage: Number(parts[5]),
      txId: action.in[0]?.txID,
      height: action.height,
      timestamp: action.date
    };
  },
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