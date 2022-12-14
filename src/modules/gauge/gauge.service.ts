import { Injectable } from '@nestjs/common';
import { GaugeSubgraphService } from '../subgraphs/gauge-subgraph/gauge-subgraph.service';
import {
  GaugeLiquidityGaugesQueryVariables,
  GaugeSharesQueryVariables,
} from '../subgraphs/gauge-subgraph/generated/gauge-subgraph-types';
import { GaugeShare, GaugeUserShare } from './types';

@Injectable()
export class GaugeService {
  constructor(private readonly gaugeSubgraphService: GaugeSubgraphService) {}

  async getAllGaugeAddresses(): Promise<string[]> {
    return await this.gaugeSubgraphService.getAllGaugeAddresses();
  }

  public async getAllGauges(args: GaugeLiquidityGaugesQueryVariables) {
    const gauges = await this.gaugeSubgraphService.getAllGauges(args);

    return gauges.map(({ id, poolId, totalSupply, shares, tokens }) => ({
      id,
      address: id,
      poolId,
      totalSupply,
      shares:
        shares?.map((share) => ({
          userAddress: share.user.id,
          amount: share.balance,
        })) ?? [],
      tokens: tokens,
    }));
  }
  async getAllUserShares(userAddress: string): Promise<GaugeUserShare[]> {
    const userGauges = await this.gaugeSubgraphService.getUserGauges(userAddress);
    return (
      userGauges?.gaugeShares?.map((share) => ({
        gaugeAddress: share.gauge.id,
        poolId: share.gauge.poolId,
        amount: share.balance,
        tokens: share.gauge.tokens ?? [],
      })) ?? []
    );
  }

  async getAllGaugeShares(args: GaugeSharesQueryVariables): Promise<GaugeShare[]> {
    return await this.gaugeSubgraphService.getAllGaugeShares(args);
  }

  async getMetadata() {
    return this.gaugeSubgraphService.getMetadata();
  }
}
