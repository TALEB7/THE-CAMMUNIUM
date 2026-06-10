import { api } from '@/lib/api';

// ==================== Trending Categories ====================

export interface TrendingCategory {
  category: string;
  trend_score: number;
  growth_rate: number;
  avg_daily_views: number;
}

export async function getTrendingCategories(
  windowDays = 7,
  limit = 8,
): Promise<{ trending: TrendingCategory[]; computed_at: string }> {
  const { data } = await api.get('/analytics/trending-categories', {
    params: { window: windowDays, limit },
  });
  return data;
}

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
