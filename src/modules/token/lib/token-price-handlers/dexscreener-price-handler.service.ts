import { TokenPriceHandler } from '../../token-types';
import { PrismaService } from 'nestjs-prisma';
import { PrismaTokenWithTypes } from 'prisma/prisma-types';
import { timestampRoundedUpToNearestHour } from 'src/modules/utils/time';
import { getDexPriceFromPair } from 'src/modules/common/token/dexscreener';

export class DexscreenerPriceHandlerService implements TokenPriceHandler {
  public readonly exitIfFails = false;
  public readonly id = 'DexscreenerPriceHandlerService';

  constructor(private readonly prisma: PrismaService) {}

  async getAcceptedTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
    return tokens
      .filter((token) => token.useDexscreener && token.dexscreenPairAddress)
      .map((token) => token.address);
  }

  async updatePricesForTokens(tokens: PrismaTokenWithTypes[]): Promise<string[]> {
    const timestamp = timestampRoundedUpToNearestHour();
    // const pools = await this.prisma.prismaPool.findMany({
    //   where: { dynamicData: { totalLiquidity: { gt: 0.1 } } },
    //   include: { dynamicData: true },
    // });
    let updated: string[] = [];
    let operations: any[] = [];

    for (const token of tokens) {
      // const pool = pools.find((pool) => pool.address === token.address);
      // if (pool?.dynamicData && pool.dynamicData.totalLiquidity !== 0) {
      //   const price = pool.dynamicData.totalLiquidity / parseFloat(pool.dynamicData.totalShares);
      // }

      // We know the token has the pair address at this point
      const screenerPrice = await getDexPriceFromPair('bsc', token.dexscreenPairAddress);
      const price = screenerPrice.priceNum;

      updated.push(token.address);

      // console.log(`DexscreenerPriceHandlerService: token: ${token.symbol} - price: ${price}`);

      operations.push(
        this.prisma.prismaTokenPrice.upsert({
          where: { tokenAddress_timestamp: { tokenAddress: token.address, timestamp } },
          update: { price: price, close: price },
          create: {
            // create a history record
            tokenAddress: token.address,
            timestamp,
            price,
            high: price,
            low: price,
            open: price,
            close: price,
          },
        }),
      );

      operations.push(
        this.prisma.prismaTokenCurrentPrice.upsert({
          where: { tokenAddress: token.address },
          update: { price: price },
          create: {
            tokenAddress: token.address,
            timestamp,
            price,
          },
        }),
      );
    }

    await Promise.all(operations);

    return updated;
  }
}
