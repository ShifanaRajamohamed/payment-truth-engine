import { Injectable } from '@angular/core';
import { DataService, CityMetric } from '../services/data.service';
import { SimulationParams, SimulationResult } from './agent.types';

/**
 * AgentToolsService
 *
 * Provides typed, structured data retrieval functions used by AgentService.
 * Each tool returns structured data — the agent formats it into natural language.
 * Tool names mirror the spec: getRevenue, getTopRegions, runSimulation, etc.
 */
@Injectable({ providedIn: 'root' })
export class AgentToolsService {

  constructor(private data: DataService) {}

  // ── Payment tools ─────────────────────────────────────────────────────────

  getRevenue(region?: string): { amount: number; label: string; trend: number; period: string } {
    if (region) {
      const city = this.data.getCityByName(region);
      if (city) {
        return { amount: city.revenue, label: this._formatInr(city.revenue), trend: city.growth, period: 'this month' };
      }
    }
    return { amount: this.data.volume(), label: this._formatInr(this.data.volume()), trend: this.data.volumeTrend(), period: 'this month' };
  }

  getPaymentSuccessRate(region?: string): { rate: number; outOf: string; trend: number } {
    if (region) {
      const city = this.data.getCityByName(region);
      if (city) {
        return { rate: city.successRate, outOf: `${Math.round(city.successRate)} out of 100`, trend: 0 };
      }
    }
    return { rate: this.data.successRate(), outOf: `${Math.round(this.data.successRate())} out of 100`, trend: this.data.successRateTrend() };
  }

  getPaymentCount(): { count: number; trend: number } {
    return { count: this.data.totalOrders(), trend: 12.2 };
  }

  getFailedPayments(): { count: number; topReason: string; rate: number } {
    const failed = this.data.transactions().filter(t => t.status === 'failed');
    return {
      count: failed.length,
      topReason: failed[0]?.failureReason ?? 'Network timeout',
      rate: this.data.failureRate(),
    };
  }

  getSettlementSummary(): { time: string; trend: number } {
    return { time: this.data.settlementTime(), trend: this.data.settlementTrend() };
  }

  // ── Geography tools ───────────────────────────────────────────────────────

  getRegionRevenue(region: string): { found: boolean; city?: CityMetric } {
    const city = this.data.getCityByName(region);
    return { found: !!city, city };
  }

  getTopRegions(n = 3): CityMetric[] {
    return this.data.getTopCities(n);
  }

  getBestGrowingRegion(): CityMetric {
    return this.data.getFastestGrowingCity();
  }

  getAllCities(): CityMetric[] {
    return this.data.cities();
  }

  getRegionStatus(region: string): { found: boolean; city?: CityMetric } {
    const city = this.data.getCityByName(region);
    return { found: !!city, city };
  }

  // ── Customer tools ────────────────────────────────────────────────────────

  getCustomerCount(): { total: number; repeat: number; repeatRate: number } {
    const all = this.data.customers();
    const repeat = all.filter(c => c.isRepeat).length;
    return { total: this.data.totalCustomers(), repeat, repeatRate: Math.round((repeat / all.length) * 100) };
  }

  getRepeatCustomers(region?: string): { count: number; rate: number } {
    const all = this.data.customers();
    const filtered = region ? all.filter(c => c.city?.toLowerCase() === region.toLowerCase()) : all;
    const repeat = filtered.filter(c => c.isRepeat).length;
    return { count: repeat, rate: filtered.length ? Math.round((repeat / filtered.length) * 100) : 0 };
  }

  getHighValueCustomers(): { count: number; avgSpend: number } {
    const hv = this.data.customers().filter(c => c.totalVolume > 500000);
    const avgSpend = hv.reduce((sum, c) => sum + c.totalVolume, 0) / (hv.length || 1);
    return { count: hv.length, avgSpend };
  }

  // ── Simulation tool ───────────────────────────────────────────────────────

  /**
   * runScenario — deterministic projection model.
   * NOT a stochastic simulation — uses simple multipliers on real data.
   * Clearly labeled as estimates.
   */
  runScenario(params: SimulationParams): SimulationResult {
    const city = this.data.getCityByName(params.region);
    const baseRevenue   = city ? city.revenue : this.data.volume();
    const baseOrders    = city ? city.orderCount : this.data.totalOrders();

    // Simple projection model — discount drives orders up, revenue up net of discount cost
    const uptakeRate    = params.segment === 'repeat' ? 0.35 : params.segment === 'new' ? 0.15 : 0.25;
    const conversionLift = params.discountPct * 0.8;    // 1% discount → ~0.8% more orders
    const revenuePerOrder = baseOrders > 0 ? baseRevenue / baseOrders : 1000;

    const extraOrders   = Math.round(baseOrders * (conversionLift / 100) * uptakeRate * (params.durationDays / 30));
    const grossRevenue  = extraOrders * revenuePerOrder;
    const discountCost  = grossRevenue * (params.discountPct / 100);
    const netRevenue    = Math.round(grossRevenue - discountCost);
    const extraReturns  = params.discountPct > 5 ? 'May increase slightly' : 'Should stay about the same';

    const revenueSign: '+' | '-' | '~' = netRevenue > 0 ? '+' : netRevenue < 0 ? '-' : '~';
    const orderSign: '+' | '-' | '~'   = extraOrders > 0 ? '+' : extraOrders < 0 ? '-' : '~';

    const segmentLabel = params.segment === 'repeat' ? 'repeat customers' : params.segment === 'new' ? 'new customers' : 'all customers';

    return {
      params,
      revenueChangeFmt: `${revenueSign}₹${Math.abs(netRevenue).toLocaleString('en-IN')}`,
      revenueChangeSign: revenueSign,
      orderChangeFmt: `${orderSign}${Math.abs(extraOrders)}`,
      orderChangeSign: orderSign,
      returnChangeLabel: extraReturns,
      recommendation: params.segment === 'all'
        ? `Try it with ${segmentLabel} in ${params.region} first — they are your most loyal buyers and will respond better to offers.`
        : `A ${params.discountPct}% offer for ${segmentLabel} in ${params.region} looks promising. Start with a small test batch before rolling it out fully.`,
      disclaimer: 'These are estimates based on past data. Actual results may vary.',
      isEstimate: true,
    };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _formatInr(n: number): string {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)} crore`;
    if (n >= 100000)   return `₹${(n / 100000).toFixed(1)} lakh`;
    if (n >= 1000)     return `₹${(n / 1000).toFixed(1)}k`;
    return `₹${n}`;
  }
}
