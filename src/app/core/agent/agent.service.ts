import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AgentIntent, AgentResponse, AgentToolCall, SimulationParams } from './agent.types';
import { AgentToolsService } from './agent-tools.service';
import { TranslationService } from '../language/translation.service';

/**
 * AgentService — Dhwani's central orchestrator.
 *
 * Architecture:
 *   Query → detectIntent() → selectTools() → executeTools() → buildResponse()
 *
 * Intent detection is rule-based keyword matching — clearly not LLM.
 * The interface is designed so a real LLM provider can replace detectIntent()
 * without touching any other service.
 *
 * The agent never invents financial numbers — all data comes from AgentToolsService.
 */
@Injectable({ providedIn: 'root' })
export class AgentService {

  constructor(
    private tools: AgentToolsService,
    private i18n: TranslationService,
    private router: Router,
  ) {}

  /**
   * Primary entry point.
   * Returns a fully formed AgentResponse with plain-language text and optional navigation.
   */
  process(query: string): AgentResponse {
    const intent = this.detectIntent(query);
    return this.executeIntent(intent, query);
  }

  // ── Intent detection ─────────────────────────────────────────────────────
  // Rule-based pattern matching. Replace this method with an LLM call to upgrade.

  private detectIntent(query: string): AgentIntent {
    const q = query.toLowerCase();

    // Simulation / Try Before You Decide
    if (this.has(q, ['discount', 'offer', 'what if', 'if i give', 'kudutha', 'kuduthal', 'தள்ளுபடி', 'छूट', 'ऑफर'])) return 'RUN_SIMULATION';

    // Recommendations
    if (this.has(q, ['what should', 'what can i do', 'improve', 'better', 'recommend', 'enna panna', 'என்ன செய்', 'क्या करूं', 'क्या करना'])) return 'GET_RECOMMENDATIONS';

    // Business overview
    if (this.has(q, ['how is', 'overview', 'summary', 'doing', 'business', 'epdi iruku', 'எப்படி', 'कैसा', 'कैसे'])) return 'GET_BUSINESS_OVERVIEW';

    // Best region
    if (this.has(q, ['best', 'top city', 'best city', 'growing', 'where', 'endha ooru', 'எந்த நகர', 'कौन सा', 'सबसे अच्छा'])) return 'GET_BEST_REGION';

    // Region why down
    if (this.has(q, ['why', 'down', 'decrease', 'yen', 'ஏன்', 'क्यों', 'कम'])) return 'REGION_WHY_DOWN';

    // Specific city revenue
    const cities = ['coimbatore', 'chennai', 'madurai', 'trichy', 'mumbai', 'bangalore', 'delhi'];
    if (cities.some(c => q.includes(c))) return 'GET_REGION_REVENUE';

    // Failed / failure
    if (this.has(q, ['fail', 'failure', 'தோல்வி', 'विफल', 'problem', 'issue'])) return 'GET_FAILED_PAYMENTS';

    // Payment methods
    if (this.has(q, ['upi', 'card', 'netbanking', 'wallet', 'method', 'கார்டு'])) return 'GET_PAYMENT_METHODS';

    // Customers
    if (this.has(q, ['customer', 'வாடிக்கையாளர்', 'ग्राहक', 'repeat', 'திரும்ப', 'नियमित'])) return 'GET_CUSTOMERS';

    // Revenue
    if (this.has(q, ['revenue', 'money', 'earn', 'வருவாய்', 'பணம்', 'आय', 'पैसे', 'how much'])) return 'GET_REVENUE';

    // Navigation
    if (this.has(q, ['map', 'show map', 'geography', 'வரைபடம்', 'नक्शा'])) return 'NAVIGATE_MAP';
    if (this.has(q, ['payment', 'transaction', 'பணம்', 'भुगतान'])) return 'NAVIGATE_PAYMENTS';
    if (this.has(q, ['decision lab', 'try', 'simulate', 'முயற்சி'])) return 'NAVIGATE_DECISION_LAB';

    return 'UNKNOWN';
  }

  // ── Intent execution ──────────────────────────────────────────────────────

  private executeIntent(intent: AgentIntent, query: string): AgentResponse {
    const toolCalls: AgentToolCall[] = [];

    switch (intent) {
      case 'GET_BUSINESS_OVERVIEW': {
        const revenue  = this.tools.getRevenue();
        const success  = this.tools.getPaymentSuccessRate();
        const orders   = this.tools.getPaymentCount();
        toolCalls.push({ tool: 'getRevenue', params: {} }, { tool: 'getPaymentSuccessRate', params: {} });
        return this.resp(intent, this.i18n.getResponse('response.business_overview'), toolCalls);
      }

      case 'GET_REVENUE': {
        const revenue = this.tools.getRevenue();
        toolCalls.push({ tool: 'getRevenue', params: {} });
        return this.resp(intent, this.i18n.getResponse('response.business_overview'), toolCalls);
      }

      case 'GET_REGION_REVENUE': {
        const city = this.extractCity(query);
        if (city === 'coimbatore') {
          toolCalls.push({ tool: 'getRegionRevenue', params: { region: city } });
          return { ...this.resp(intent, this.i18n.getResponse('response.coimbatore.revenue'), toolCalls), navigationTarget: '/app/map', focusRegion: 'Coimbatore' };
        }
        const result = this.tools.getRegionRevenue(city);
        if (result.found && result.city) {
          const c = result.city;
          const text = `${c.name} received ${c.revenue >= 100000 ? '₹' + (c.revenue / 100000).toFixed(1) + ' lakh' : '₹' + c.revenue.toLocaleString('en-IN')} this month, with ${c.growth >= 0 ? '+' : ''}${c.growth.toFixed(1)}% growth. ${c.plainStatus}.`;
          toolCalls.push({ tool: 'getRegionRevenue', params: { region: city } });
          return { ...this.resp(intent, text, toolCalls, 'high'), navigationTarget: '/app/map', focusRegion: c.name };
        }
        return this.resp(intent, this.i18n.getResponse('response.fallback'), toolCalls, 'low');
      }

      case 'GET_BEST_REGION': {
        toolCalls.push({ tool: 'getBestGrowingRegion', params: {} });
        return { ...this.resp(intent, this.i18n.getResponse('response.best_region'), toolCalls), navigationTarget: '/app/map', focusRegion: 'Coimbatore' };
      }

      case 'REGION_WHY_DOWN': {
        const city = this.extractCity(query);
        if (city === 'trichy' || city === 'trichinopoly') {
          toolCalls.push({ tool: 'getRegionStatus', params: { region: 'Trichy' } });
          return this.resp(intent, this.i18n.getResponse('response.trichy.down'), toolCalls);
        }
        toolCalls.push({ tool: 'getRegionStatus', params: { region: city } });
        return this.resp(intent, this.i18n.getResponse('response.tn.failure'), toolCalls);
      }

      case 'GET_FAILED_PAYMENTS': {
        toolCalls.push({ tool: 'getFailedPayments', params: {} });
        return { ...this.resp(intent, this.i18n.getResponse('response.tn.failure'), toolCalls), navigationTarget: '/app/payments' };
      }

      case 'GET_PAYMENT_METHODS': {
        toolCalls.push({ tool: 'getPaymentSuccessRate', params: {} });
        return this.resp(intent, this.i18n.getResponse('response.upi_vs_card'), toolCalls);
      }

      case 'GET_CUSTOMERS': {
        toolCalls.push({ tool: 'getCustomerCount', params: {} });
        return { ...this.resp(intent, this.i18n.getResponse('response.customers.overview'), toolCalls), navigationTarget: '/app/customers' };
      }

      case 'GET_RECOMMENDATIONS': {
        toolCalls.push({ tool: 'getTopRegions', params: {} });
        return { ...this.resp(intent, this.i18n.getResponse('response.what_to_do'), toolCalls), navigationTarget: '/app/opportunities' };
      }

      case 'RUN_SIMULATION': {
        const params = this.extractSimulationParams(query);
        const result = this.tools.runScenario(params);
        const text = `${this.i18n.getResponse('response.simulation.preview')} Based on your past data, giving a ${params.discountPct}% offer to ${params.segment === 'repeat' ? 'repeat customers' : 'customers'} in ${params.region} for ${params.durationDays} days could bring in ${result.revenueChangeFmt} more revenue and ${result.orderChangeFmt} more orders. ${result.recommendation}`;
        toolCalls.push({ tool: 'runScenario', params: { ...params } });
        return { ...this.resp(intent, text, toolCalls), navigationTarget: '/app/decision-lab', simulationResult: result };
      }

      case 'NAVIGATE_MAP':         return { ...this.resp(intent, 'Opening the map to show where your business is growing.', toolCalls), navigationTarget: '/app/map' };
      case 'NAVIGATE_PAYMENTS':    return { ...this.resp(intent, 'Opening your payments.', toolCalls), navigationTarget: '/app/payments' };
      case 'NAVIGATE_DECISION_LAB': return { ...this.resp(intent, 'Opening Try Before You Decide.', toolCalls), navigationTarget: '/app/decision-lab' };

      default:
        return this.resp('UNKNOWN', this.i18n.getResponse('response.fallback'), toolCalls, 'low');
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private resp(intent: AgentIntent, text: string, toolCalls: AgentToolCall[], confidence: 'high' | 'medium' | 'low' = 'medium'): AgentResponse {
    return { intent, text, toolCalls, confidence };
  }

  private has(q: string, keywords: string[]): boolean {
    return keywords.some(kw => q.includes(kw));
  }

  private extractCity(query: string): string {
    const q = query.toLowerCase();
    const cities = ['coimbatore', 'chennai', 'madurai', 'trichy', 'mumbai', 'bangalore', 'delhi'];
    return cities.find(c => q.includes(c)) ?? '';
  }

  private extractSimulationParams(query: string): SimulationParams {
    const q = query.toLowerCase();
    const city = this.extractCity(query) || 'Coimbatore';
    const cityProper = city.charAt(0).toUpperCase() + city.slice(1);

    // Extract discount percentage
    const discountMatch = q.match(/(\d+)\s*%/);
    const discountPct = discountMatch ? parseInt(discountMatch[1], 10) : 10;

    // Extract duration in days
    const durationMatch = q.match(/(\d+)\s*(day|days|நாட்கள்|दिन)/);
    const durationDays = durationMatch ? parseInt(durationMatch[1], 10) : 30;

    // Detect segment
    let segment: SimulationParams['segment'] = 'all';
    if (this.has(q, ['repeat', 'loyal', 'regular', 'திரும்ப', 'नियमित', 'விசுவாசமான'])) segment = 'repeat';
    else if (this.has(q, ['new customer', 'புதிய', 'नए'])) segment = 'new';
    else if (this.has(q, ['high value', 'high-value', 'premium', 'பெரிய'])) segment = 'high_value';

    return { region: cityProper, segment, discountPct, durationDays };
  }
}
