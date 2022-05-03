import Web3 from "web3";
import LocalStoreService from "../repositories/LocalStoreService"
import { Account } from "../types";
import { Networks } from "../utills/network";

export class Web3Service {
  private static currentWeb3 = (networkId: number) => new Web3(Networks[networkId].rpcUrl);
  
  public static async privateKeyToPublic(networkId: number, pk: string): Promise<string> {
    const result = Web3Service.currentWeb3(networkId).eth.accounts.privateKeyToAccount(pk);
    return result.address;
  } 

  public static async getAccountsBalances(networkId: number, accounts: Account[]): Promise<string[]> {
    const web3 = Web3Service.currentWeb3(networkId);
    return Promise.all(accounts.map((account) => web3.eth.getBalance(account.address)));
  } 

  public static createAccount(networkId: number): { address: string, pk: string } {
    const web3 = Web3Service.currentWeb3(networkId);
    const result = web3.eth.accounts.create();
    return { address: result.address, pk: result.privateKey };
  } 
}
