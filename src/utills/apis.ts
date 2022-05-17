import axios from 'axios';
import { Asset, Network, Transaction } from '../types';

export const getPortifolioByChain = async (wallet: string, network: Network): Promise<Asset[]> => {
  const res = await axios.get(`https://pro-openapi.debank.com/v1/user/token_list?id=${wallet}&chain_id=${network.debankChainName}&is_all=false&has_balance=true`, {
    headers: {
      AccessKey: process.env.DEBANK_KEY,
      accept: 'application/json',
    }
  });
  
  return res.data.map((el: any) => ({
    address: el.id,
    symbol: el.symbol,
    decimals: el.decimals,
    name: el.name,
    balance: el.amount,
    price: el.price,
  }));
};

export const getTransactions = async (wallet: string, network: Network): Promise<Transaction[]> => {
  const res = await axios.get(`
    ${network.blockExplorerApiUrl}?module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=${network.blockExplorerApiKey}
  `);
  
  return res.data.result;
}
