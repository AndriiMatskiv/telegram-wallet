import Web3 from "web3";
import staking from "../abis/staking";
import { Network, Account, PoolInfo, StakingInfo, PoolPersonalInfo } from "../types";
import Web3Helper from "./web3";

export default class StakingHelper {  
  private static getContract(network: Network) {
    const web3 = Web3Helper.currentWeb3(network.id);
    return new web3.eth.Contract(staking, network.stakingPoolAddress);
  }

  public static async getPoolsAmount(network: Network): Promise<number> {
    const contract = StakingHelper.getContract(network);
    return Number(await contract.methods.poolLength().call());
  } 

  public static async getPoolInfo(network: Network, poolId: number): Promise<PoolInfo> {
    const contract = StakingHelper.getContract(network);
    return await contract.methods.poolInfo(poolId).call();
  } 

  public static async getPrice(network: Network): Promise<number> {
    const contract = StakingHelper.getContract(network);
    return Number(await contract.methods.priceByEth().call());
  } 

  public static async getAllPoolsInfos(network: Network): Promise<PoolInfo[]> {
    const amount = await StakingHelper.getPoolsAmount(network);
    return await Promise.all(Array.from(Array(amount).keys()).map((index) => StakingHelper.getPoolInfo(network, index)));
  } 
  
  public static async getAllPersonalInfo(network: Network, account: Account): Promise<StakingInfo> {
    const amount = await StakingHelper.getPoolsAmount(network);
    const pools = await Promise.all(Array.from(Array(amount).keys()).map((index) => StakingHelper.getPersonalInfoByPool(network, account, index)));

    return {
      pools,
      totalBonus: pools.reduce((partialSum, el) => partialSum + el.bonus, 0),
      totalStaked: pools.reduce((partialSum, el) => partialSum + el.staked, 0),
      balance: pools.reduce((partialSum, el) => partialSum + el.balance, 0),
    }
  }

  public static async getPersonalInfoByPool(network: Network, account: Account, poolId: number): Promise<PoolPersonalInfo> {
    const contract = StakingHelper.getContract(network);
    const [staked, bonus, balance] = await Promise.all([
      contract.methods.getStaked(account.address, poolId).call(),
      contract.methods.getCurrentBonus(account.address, poolId).call(),
      contract.methods.balanceOf(account.address, poolId).call(),
    ]);

    return { staked, bonus, balance }
  }

  public static async stake(network: Network, account: Account, amount: number, poolId: number): Promise<void> {
    const contract = StakingHelper.getContract(network);
    const data = contract.methods.stake(Web3.utils.toWei(amount.toString()), poolId).encodeABI();

    await StakingHelper.txWrap(network, account, data);
  } 

  public static async withdraw(network: Network, account: Account, amount: number, poolId: number): Promise<void> {
    const contract = StakingHelper.getContract(network);
    const data = contract.methods.withdraw(Web3.utils.toWei(amount.toString()), poolId).encodeABI();

    await StakingHelper.txWrap(network, account, data);
  } 

  public static async buy(network: Network, account: Account, amount: number): Promise<void> {
    const contract = StakingHelper.getContract(network);
    const data = contract.methods.buyPoints().encodeABI();

    await StakingHelper.txWrap(network, account, data, Web3.utils.toWei(amount.toString()));
  } 

  private static async txWrap(network: Network, account: Account, data: any, value = "0"): Promise<void> {
    const web3 = Web3Helper.currentWeb3(network.id);

    const transaction = {
      from: account.address,
      to: network.stakingPoolAddress,
      value,
      gas: 30000,
      data,
     };

    const signed = await web3.eth.accounts.signTransaction(transaction, account.privateKey);
    await web3.eth.sendSignedTransaction(signed.rawTransaction);
  }
}
