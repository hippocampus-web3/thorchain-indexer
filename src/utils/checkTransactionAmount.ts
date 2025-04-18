import { MidgardAction } from "../types";
import logger from "./logger";

export function checkTransactionAmount(action: MidgardAction, minBaseAmount: number) {
    let isValid = false
    const baseAmount = action.in[0]?.coins.find(coin => coin.asset === 'THOR.RUNE')?.amount;
    if (!baseAmount) {
        isValid = false;
    }
    isValid = Number(baseAmount) >= minBaseAmount;
    if (!isValid) {
        logger.warn(`Skipping action ${action.in[0]?.txID}: insufficient amount. minBaseAmount ${minBaseAmount} baseAmount ${baseAmount}`);
        throw new Error(`Skipping action ${action.in[0]?.txID}: insufficient amount`);
    }
}