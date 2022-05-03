// USER LOCAL (MESSAGE)

export interface Account {
  id: number;
  name: string;
  address: string;
  imported: boolean;
  privateKey: string;
}

// DB

export interface User {
  id: number;
  tid: number;
  password: string;
  storageMessageId: number;
}

// LOCAL

export interface Network {
  id: number;
  name: string;
  symbol: string;
  currencySymbol: string;
  rpcUrl: string;
  faucetUrl: string;
  blockExplorerUrl: string;
}

export interface RuntimeData {
  password?: string;
  lastLogin?: number;
  msgId?: number;
  currentAction?: ActionTypes;
}

export type ActionTypes =  
  'password_input' |
  'password_setup' |
  'account_import' |
  'current_account_set' |
  'current_network_set';
