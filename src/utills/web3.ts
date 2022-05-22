import Web3 from "web3";
import erc20 from "../abis/erc20";
import { Account, Asset, TokenInfo, TransactionReceipt } from "../types";
import { Networks } from "../utills/network";
import { fromUnits } from "./bn";

export default class Web3Helper {
  public static currentWeb3 = (networkId: number) => new Web3(Networks[networkId].rpcUrl);
  
  public static async privateKeyToPublic(networkId: number, pk: string): Promise<string> {
    const result = Web3Helper.currentWeb3(networkId).eth.accounts.privateKeyToAccount(pk);
    return result.address;
  } 

  public static async getAccountsBalances(networkId: number, accounts: Account[]): Promise<string[]> {
    const web3 = Web3Helper.currentWeb3(networkId);
    return Promise.all(accounts.map((account) => web3.eth.getBalance(account.address)));
  } 

  public static createAccount(networkId: number): { address: string, pk: string } {
    const web3 = Web3Helper.currentWeb3(networkId);
    const result = web3.eth.accounts.create();
    return { address: result.address, pk: result.privateKey };
  } 

  public static async getBalance(networkId: number, account: Account): Promise<number> {
    const web3 = Web3Helper.currentWeb3(networkId);
    return Number(web3.utils.fromWei(await web3.eth.getBalance(account.address)));
  } 

  public static async getTokenInfo(networkId: number, token: string, account: Account): Promise<TokenInfo> {
    const web3 = Web3Helper.currentWeb3(networkId);
    const contract = new web3.eth.Contract(erc20, token);

    const [name, symbol, decimals, balance] = await Promise.all([
      contract.methods.name().call(),
      contract.methods.symbol().call(),
      contract.methods.decimals().call(),
      contract.methods.balanceOf(account.address).call(),
    ]);

    return { name, symbol, decimals: Number(decimals), balance: fromUnits(balance, decimals) }
  }

  public static async getAssstBalance(networkId: number, token: string, account: Account): Promise<number> {
    const web3 = Web3Helper.currentWeb3(networkId);
    const contract = new web3.eth.Contract(erc20, token);

    const [decimals, balance] = await Promise.all([
      contract.methods.decimals().call(),
      contract.methods.balanceOf(account.address).call(),
    ]);

    return fromUnits(balance, decimals);
  }


  public static async sendAsset(networkId: number, asset: Asset, recipient: string, amount: number, account: Account): Promise<void> {
    const web3 = Web3Helper.currentWeb3(networkId);
    const contract = new web3.eth.Contract(erc20, asset.address);

    const func = contract.methods.transfer(recipient, Web3.utils.toWei(amount.toString())).encodeABI();

    const transaction = {
      from: account.address,
      to: asset.address,
      value: 0,
      gas: 300000,
      data: func,
     };

    const signed = await web3.eth.accounts.signTransaction(transaction, account.privateKey);
    await web3.eth.sendSignedTransaction(signed.rawTransaction);
  } 

  public static async approveAsset(networkId: number, token: string, spender: string, amount: number, account: Account): Promise<void> {
    const web3 = Web3Helper.currentWeb3(networkId);
    const contract = new web3.eth.Contract(erc20, token);

    const func = contract.methods.approve(spender, Web3.utils.toWei(amount.toString())).encodeABI();

    const transaction = {
      from: account.address,
      to: token,
      value: 0,
      gas: 300000,
      data: func,
     };

    const signed = await web3.eth.accounts.signTransaction(transaction, account.privateKey);
    await web3.eth.sendSignedTransaction(signed.rawTransaction);
  } 

  public static async sendEth(networkId: number, account: Account, recipient: string, amount: number): Promise<void> {
    const web3 = Web3Helper.currentWeb3(networkId);

    const transaction = {
      from: account.address,
      to: recipient,
      value: Web3.utils.toWei(amount.toString()),
      gas: 30000,
     };
    
    const signed = await web3.eth.accounts.signTransaction(transaction, account.privateKey);
    await web3.eth.sendSignedTransaction(signed.rawTransaction);
  } 

  public static async getTxInfo(hash: string, networkId: number): Promise<TransactionReceipt> {
    const web3 = Web3Helper.currentWeb3(networkId);
    return await web3.eth.getTransactionReceipt(hash);
  } 
}
