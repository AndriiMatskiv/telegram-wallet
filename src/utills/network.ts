import { Network } from '../types';

export const Networks: Record<number, Network> = {
  4: {
    id: 4,
    name: 'Rinkeby Test Network',
    symbol: 'rinkeby',
    currencySymbol: 'ETH',
    rpcUrl: 'https://rinkeby.infura.io/v3/e24fe2d850ee49e09cc4a302c6a9179b',
    blockExplorerUrl: 'https://rinkeby.etherscan.io/',
    faucetUrl: 'https://faucet.rinkeby.io/',
  },
};
