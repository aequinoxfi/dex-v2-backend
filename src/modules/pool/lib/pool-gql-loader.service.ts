import { Injectable } from '@nestjs/common';
import { GqlPoolMinimal, GqlPoolToken, GqlPoolUnion } from 'src/graphql';
import { PrismaService } from 'nestjs-prisma';
import {
  prismaPoolMinimal,
  PrismaPoolWithExpandedNesting,
  prismaPoolWithExpandedNesting,
} from 'prisma/prisma-types';
import { PoolGqlLoaderUtils } from './gql-loader-utils.service';
import { QueryPoolGetPoolsArgs } from 'src/gql-addons';

@Injectable()
export class PoolGqlLoaderService {
  constructor(private prisma: PrismaService, private poolUtils: PoolGqlLoaderUtils) {}

  async getPool(id: string) {
    const pool = await this.prisma.prismaPool.findUnique({
      where: { id },
      include: prismaPoolWithExpandedNesting.include,
    });

    if (!pool) {
      throw new Error('Pool with id does not exist');
    }

    if (pool.type === 'UNKNOWN') {
      throw new Error('Pool exists, but has an unknown type');
    }

    return this.poolUtils.mapPoolToGqlPool(pool);
  }

  async getPools(args: QueryPoolGetPoolsArgs): Promise<any[]> {
    const pools = await this.prisma.prismaPool.findMany({
      ...this.poolUtils.mapQueryArgsToPoolQuery(args),
      include: prismaPoolMinimal.include,
    });

    return pools.map((pool) => this.poolUtils.mapToMinimalGqlPool(pool));
  }
}
