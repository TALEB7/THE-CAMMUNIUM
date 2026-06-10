import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface EmbeddingResult {
  id: string;
  embedding: number[];
  model: string;
  dimensions: number;
}

export interface SimilarItem {
  id: string;
  score: number;
}

export interface RecommendationItem {
  listing_id: string;
  relevance_score: number;
  diversity_score: number;
  final_score: number;
}

export interface MentorMatchItem {
  mentor_profile_id: string;
  score: number;
  semantic_score: number;
  rating_score: number;
  experience_score: number;
  sessions_score: number;
}

export interface MentorCandidate {
  mentor_profile_id: string;
  embedding: number[];
  rating: number;
  years_exp: number;
  total_sessions: number;
  is_available: boolean;
}

export interface CinExtractionResult {
  card_number?: string;
  surname?: string;
  given_name?: string;
  full_name?: string;
  birth_date?: string;
  birth_place?: string;
  address?: string;
  nationality?: string;
  ocr_text?: string;
  confidence: number;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * Extract data from CNIE.
   * Rethrows errors because identity verification is critical.
   */
  async extractCin(imageBuffer: Buffer): Promise<CinExtractionResult> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<CinExtractionResult>('/cnie/extract-base64', {
          image_base64: imageBuffer.toString('base64'),
        }),
      );
      return data;
    } catch (err: any) {
      this.logger.error(`AI: Failed to extract CNIE data: ${err?.message || err}`, err?.stack);
      throw err;
    }
  }

  async embedListing(params: {
    listingId: string;
    title: string;
    description: string;
    tags: string[];
    category?: string;
  }): Promise<EmbeddingResult | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<EmbeddingResult>('/embeddings/listing', {
          listing_id: params.listingId,
          title: params.title,
          description: params.description,
          tags: params.tags,
          category: params.category ?? '',
        }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to generate listing embedding for ${params.listingId}: ${err?.message || err}`);
      return null;
    }
  }

  async embedMentor(params: {
    mentorProfileId: string;
    headline: string;
    bio: string;
    expertise: string[];
    industries: string[];
  }): Promise<EmbeddingResult | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<EmbeddingResult>('/embeddings/mentor', {
          mentor_profile_id: params.mentorProfileId,
          headline: params.headline,
          bio: params.bio,
          expertise: params.expertise,
          industries: params.industries,
        }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to generate mentor embedding for ${params.mentorProfileId}: ${err?.message || err}`);
      return null;
    }
  }

  async detectPriceAnomaly(params: {
    price: number;
    comparablePrices: number[];
  }): Promise<{ is_anomaly: boolean; z_score: number; modified_z_score: number; market_median: number; market_mean: number; direction: string; confidence: number } | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<any>('/anomaly/price', {
          price: params.price,
          comparable_prices: params.comparablePrices,
        }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to run price anomaly check: ${err?.message || err}`);
      return null;
    }
  }

  async getPersonalizedRecommendations(params: {
    userEmbedding: number[];
    candidates: Array<{ listing_id: string; embedding: number[] }>;
    topK?: number;
    diversityLambda?: number;
  }): Promise<RecommendationItem[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ recommendations: RecommendationItem[] }>('/recommendations/listings', {
          user_embedding: params.userEmbedding,
          candidates: params.candidates,
          top_k: params.topK ?? 20,
          diversity_lambda: params.diversityLambda ?? 0.3,
        }),
      );
      return data.recommendations || [];
    } catch (err: any) {
      this.logger.warn(`AI: Failed to get recommendations: ${err?.message || err}`);
      return [];
    }
  }

  async predictChurn(users: Array<{
    user_id: string;
    days_since_last: number;
    action_count_30d: number;
    listing_count: number;
    session_count: number;
    tks_spent: number;
    account_age_days: number;
    membership_active: boolean;
    monthly_tks_spent?: number;
    membership_revenue?: number;
  }>): Promise<{
    predictions: Array<{
      user_id: string;
      churn_score: number;
      risk_level: string;
      rfm_recency: number;
      rfm_frequency: number;
      rfm_monetary: number;
      recommended_actions: string[];
      clv_estimate: number;
      clv_tier: string;
    }>;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
  } | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<any>('/churn/predict', { users }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to run churn prediction: ${err?.message || err}`);
      return null;
    }
  }

  async getTrendingCategories(params: {
    dataPoints: Array<{
      category: string;
      date: string;
      view_count: number;
      search_count: number;
      listing_count: number;
    }>;
    topK?: number;
    windowDays?: number;
  }): Promise<{ trending: Array<{ category: string; trend_score: number; growth_rate: number; avg_daily_views: number }>; computed_at: string } | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<any>('/trending/categories', {
          data_points: params.dataPoints,
          top_k: params.topK ?? 10,
          window_days: params.windowDays ?? 7,
        }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to get trending categories: ${err?.message || err}`);
      return null;
    }
  }

  async detectReviewFraud(
    reviews: Array<{ text: string; rating: number; reviewer_id: string; created_at: string; listing_id: string }>,
    listingId: string,
  ): Promise<{ is_suspicious: boolean; anomaly_score: number; flags: string[] }> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<any>('/fraud/reviews', { reviews, listing_id: listingId }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to run review fraud detection for listing ${listingId}: ${err?.message || err}`);
      return { is_suspicious: false, anomaly_score: 0, flags: [] };
    }
  }

  async analyzeSentiment(texts: string[]): Promise<{
    results: Array<{ text: string; label: string; score: number; compound: number }>;
    avg_compound: number;
  }> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<any>('/sentiment/analyze', { texts }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to run sentiment analysis: ${err?.message || err}`);
      return { results: [], avg_compound: 0 };
    }
  }

  async classifyListing(params: {
    title: string;
    description: string;
    availableCategories: string[];
  }): Promise<{ predicted_category: string; confidence: number; suggested_tags: string[]; urgency: string } | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<any>('/classify/listing', {
          title: params.title,
          description: params.description,
          available_categories: params.availableCategories,
        }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to classify listing: ${err?.message || err}`);
      return null;
    }
  }

  async suggestPrice(params: {
    condition: string;
    comparablePrices: number[];
  }): Promise<{ min_price: number; max_price: number; recommended_price: number; confidence: number; method: string } | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<any>('/pricing/suggest', {
          title: '',
          description: '',
          category: '',
          condition: params.condition,
          comparable_prices: params.comparablePrices,
        }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to get price suggestion: ${err?.message || err}`);
      return null;
    }
  }

  async matchMentors(params: {
    queryEmbedding: number[];
    candidates: MentorCandidate[];
    topK?: number;
  }): Promise<MentorMatchItem[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ matches: MentorMatchItem[] }>('/mentors/match', {
          query_embedding: params.queryEmbedding,
          candidates: params.candidates,
          top_k: params.topK ?? 10,
        }),
      );
      return data.matches || [];
    } catch (err: any) {
      this.logger.warn(`AI: Failed to match mentors: ${err?.message || err}`);
      return [];
    }
  }

  async predictEta(params: {
    categoryName?: string;
    sellerCity?: string;
    buyerCity?: string;
    condition?: string;
    sellerListingCount: number;
    hourOfDay?: number;
    dayOfWeek?: number;
  }): Promise<{ eta_minutes: number; eta_hours: number; eta_days: number; confidence: number; breakdown: Record<string, string | number> } | null> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<any>('/eta/predict', {
          category_name:         params.categoryName,
          seller_city:           params.sellerCity,
          buyer_city:            params.buyerCity,
          condition:             params.condition,
          seller_listing_count:  params.sellerListingCount,
          hour_of_day:           params.hourOfDay,
          day_of_week:           params.dayOfWeek,
        }),
      );
      return data;
    } catch (err: any) {
      this.logger.warn(`AI: Failed to predict ETA: ${err?.message || err}`);
      return null;
    }
  }

  async findSimilarListings(params: {
    listingId: string;
    queryEmbedding: number[];
    candidates: Array<{ listing_id: string; embedding: number[] }>;
    topK?: number;
  }): Promise<SimilarItem[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.post<{ listing_id: string; similar: SimilarItem[] }>(
          '/similarity/listings',
          {
            listing_id: params.listingId,
            query_embedding: params.queryEmbedding,
            candidate_embeddings: params.candidates,
            top_k: params.topK ?? 5,
          },
        ),
      );
      return data.similar || [];
    } catch (err: any) {
      this.logger.warn(`AI: Failed to search similar listings for ${params.listingId}: ${err?.message || err}`);
      return [];
    }
  }
}
