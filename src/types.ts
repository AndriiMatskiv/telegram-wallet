export interface Account {
  id: number;
  name: string;
  address: string;
  imported: boolean;
  privateKey: string;
}

export interface Asset {
  address: string;
  symbol: string;
  decimals: number;
  name: string;
  balance: number;
  price: number;
}

export interface User {
  id: number;
  tid: number;
  password: string;
  storageMessageId: number;
}

export interface LocalStore {
  accounts: Account[];
  currentAccountId?: number;
  currentNetworkId: number;
}

export interface Network {
  id: number;
  name: string;
  symbol: string;
  currencySymbol: string;
  rpcUrl: string;
  faucetUrl: string;
  blockExplorerUrl: string;
  blockExplorerApiUrl: string;
  blockExplorerApiKey: string;
  debankChainName: string;
  tokenAddress: string;
  stakingPoolAddress: string;
}

export interface RuntimeData {
  password?: string;
  lastLogin?: number;
  msgId?: number;
  currentAction?: ActionTypes;
  temp: any;
}

export type ActionTypes =  
  'password_input' |
  'password_setup' |
  'account_import' |
  'current_account_set' |
  'current_network_set' |
  'eth_send_1' |
  'eth_send_2' |
  'eth_send_3' |
  'asset_send_1' |
  'asset_send_2' |
  'asset_send_3' |
  'asset_send_4' |
  'stake_1' |
  'stake_2' |
  'stake_3' |
  'unstake_1' |
  'unstake_2' |
  'unstake_3' |
  'approve_asset_1' |
  'approve_asset_2' |
  'tx_info';


export interface Transaction {
  blockNumber: number;
  timeStamp: number;
  hash: string;
  nonce: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string;
  value: string;
  isError: boolean;
}

export interface TransactionReceipt {
  status: boolean;
  transactionHash: string;
  transactionIndex: number;
  blockHash: string;
  blockNumber: number;
  from: string;
  to: string;
  contractAddress?: string;
  cumulativeGasUsed: number;
  gasUsed: number;
  logs: any[];
  logsBloom: string;
}

export interface PoolInfo {
  token: string;
  rewardRate: number;
  minRewardStake: number;
  maxBonus: number;
  bonusDuration: number;
  bonusRate: number;
  active: number;
  id: number;
}

export interface PoolPersonalInfo {
  staked: number;
  bonus: number;
  balance: number;
}


export interface StakingInfo {
  pools: PoolPersonalInfo[];
  totalBonus: number;
  totalStaked: number;
  balance: number;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  balance: number;
}
