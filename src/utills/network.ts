import { Network } from '../types';

export const Networks: Record<number, Network> = {
  4: {
    id: 4,
    name: 'Rinkeby Test Network',
    symbol: 'rinkeby',
    currencySymbol: 'ETH',
    rpcUrl: 'https://rinkeby.infura.io/v3/e24fe2d850ee49e09cc4a302c6a9179b',
    blockExplorerUrl: 'https://rinkeby.etherscan.io/',
    blockExplorerApiUrl: 'https://api.etherscan.io/api',
    blockExplorerApiKey: '1KGDG8C8XS4PBGAR51D8WMXQ2XHQIH5GVR',
    faucetUrl: 'https://faucet.rinkeby.io/',
    debankChainName: 'eth'
  },
  1: {
    id: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ethereum',
    currencySymbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/e24fe2d850ee49e09cc4a302c6a9179b',
    blockExplorerUrl: 'https://etherscan.io/',
    blockExplorerApiUrl: 'https://api.etherscan.io/api',
    blockExplorerApiKey: '1KGDG8C8XS4PBGAR51D8WMXQ2XHQIH5GVR',
    faucetUrl: '',
    debankChainName: 'eth'
  },
  56: {
    id: 56,
    name: 'Binance Smart Chain',
    symbol: 'bsc',
    currencySymbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    blockExplorerUrl: 'https://bscscan.com/',
    blockExplorerApiUrl: 'https://api.bscscan.com/api',
    blockExplorerApiKey: '2KAST98UR93TCCPPNPXJ9562FAVHDIN3Z3',
    faucetUrl: '',
    debankChainName: 'bsc'
  },
};
