import { Account } from "../types";

export const cutAddress = (a: string) => 
  a ? `${a.substr(0, 6)}...${a.substr(a.length - 4, a.length - 1)}` : '';

export const getNewAccountId = (accounts: Account[]): number => {
  let max = 0;
  accounts.forEach((account) => max = account.id > max ? account.id : max);
  return max + 1;
};

export const round = (num: number | null, d: number = 3): string => {
  if (!num || isNaN(num)) return '0';
  return (Math.floor(num * 10 ** d) / 10 ** d).toString().toLocaleString();
};
