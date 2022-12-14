import { Provider } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '../config.service';
import { AccountWeb3 } from '../types';

export const RPC = 'RPC';

export const RpcProvider: Provider = {
  provide: RPC,
  useFactory: async (config: ConfigService): Promise<AccountWeb3> => {
    let rpcUrl = '';
    const chainId = config.env.CHAIN_ID;
    if (chainId === 5) {
      rpcUrl = process.env.GOERLI_RPC;
    } else if (chainId === 56) {
      rpcUrl = process.env.BSC_RPC;
    } else {
      throw 'Chain id?';
    }

    if (!rpcUrl) {
      throw new Error('RPC URL not provided.');
    }

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    await provider.ready;
    console.log('Using RPC: ' + rpcUrl);

    let wallet: ethers.Wallet = null;

    if (process.env.NODE_ENV === 'development') {
      wallet = new ethers.Wallet(process.env.DEV_KEY);
      wallet = wallet.connect(provider);
    }

    return {
      provider,
      chainId,
      rpcUrl,
      wallet,
    };
  },
  inject: [ConfigService],
};
