import { api } from '@/lib/api';



// ==================== Churn Risk ====================

export interface ChurnPrediction {
  user_id: string;
  churn_score: number;
  risk_level: string;
  rfm_recency: number;
  rfm_frequency: number;
  rfm_monetary: number;
  recommended_actions: string[];
  clv_estimate: number;
  clv_tier: string;
}

export interface ChurnRiskResponse {
  predictions: ChurnPrediction[];
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export async function getChurnRisk(risk?: string): Promise<ChurnRiskResponse> {
  const { data } = await api.get<ChurnRiskResponse>('/analytics/churn-risk', {
    params: risk ? { risk } : {},
  });
  return data;
}
