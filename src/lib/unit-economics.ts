/**
 * Tabibi AI — Unit Economics & Profit Margin Calculator for Medical Clinics
 */

export interface UnitEconomicsInput {
  patientsPerMonth: number;
  avgMessagesPerPatient: number;
  monthlySubscriptionPriceEgp: number; // e.g., 1500 EGP
  llmModel: string; // "gpt-4o-mini"
}

export interface UnitEconomicsOutput {
  totalMessagesPerMonth: number;
  estimatedAiMessagesRatio: number; // % of messages requiring LLM call vs deterministic rules
  totalLlmCallsPerMonth: number;
  avgCostPerLlmCallUsd: number;
  totalMonthlyAiCostUsd: number;
  totalMonthlyAiCostEgp: number; // Based on exchange rate e.g., 1 USD = 48 EGP
  grossProfitEgp: number;
  grossMarginPercentage: number;
}

export function calculateClinicUnitEconomics(input: UnitEconomicsInput): UnitEconomicsOutput {
  const { patientsPerMonth, avgMessagesPerPatient, monthlySubscriptionPriceEgp } = input;

  const totalMessagesPerMonth = patientsPerMonth * avgMessagesPerPatient;
  
  // Approximately 30% of messages hit LLM, while 70% are handled by fast rules/FAQs/safety
  const estimatedAiMessagesRatio = 0.3;
  const totalLlmCallsPerMonth = Math.ceil(totalMessagesPerMonth * estimatedAiMessagesRatio);

  // gpt-4o-mini: ~150 prompt tokens + 50 completion tokens = ~$0.00006 USD per call
  const avgCostPerLlmCallUsd = (150 * 0.15 + 50 * 0.6) / 1000000;
  const totalMonthlyAiCostUsd = totalLlmCallsPerMonth * avgCostPerLlmCallUsd;

  const usdToEgp = 48.0;
  const totalMonthlyAiCostEgp = totalMonthlyAiCostUsd * usdToEgp;

  const grossProfitEgp = monthlySubscriptionPriceEgp - totalMonthlyAiCostEgp;
  const grossMarginPercentage = (grossProfitEgp / monthlySubscriptionPriceEgp) * 100;

  return {
    totalMessagesPerMonth,
    estimatedAiMessagesRatio,
    totalLlmCallsPerMonth,
    avgCostPerLlmCallUsd,
    totalMonthlyAiCostUsd,
    totalMonthlyAiCostEgp,
    grossProfitEgp,
    grossMarginPercentage,
  };
}
