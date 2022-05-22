import BigNumber from "bignumber.js"

export const fromUnits = (number: string, units: number): number => 
  new BigNumber(number).dividedBy(new BigNumber(10).pow(units)).toNumber();
