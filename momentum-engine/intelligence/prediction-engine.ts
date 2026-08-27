/**
 * Momentum Intelligence Engine - Prediction Engine
 * Outcome Forecaster with Explicit Uncertainty Intervals & Prediction Error Tracking
 */

import { EngineContext, PredictionResult } from '../core/types';

export class PredictionEngine {
  private predictions: Map<string, PredictionResult> = new Map();
  private readonly modelVersion = 'momentum_predictor_v1.0';

  /**
   * Forecasts probability of follow-up conversion or connection alignment
   */
  public predictConnectionValue(params: {
    userSharedInterestsCount: number;
    interactionDurationSec: number;
    trustScore: number;
    context: EngineContext;
  }): PredictionResult<{ conversionProbability: number; highSignalLikelihood: boolean }> {
    const { userSharedInterestsCount, interactionDurationSec, trustScore, context } = params;

    // Bounded heuristic regression prior
    const rawProb =
      0.2 +
      0.15 * Math.min(3, userSharedInterestsCount) +
      0.2 * Math.min(1.0, interactionDurationSec / 180) +
      0.25 * trustScore;

    const conversionProbability = Math.max(0.05, Math.min(0.98, Number(rawProb.toFixed(3))));
    const confidence = Math.min(0.95, 0.4 + userSharedInterestsCount * 0.1 + trustScore * 0.2);

    // Uncertainty interval based on confidence: [prob - (1-conf)/2, prob + (1-conf)/2]
    const delta = (1 - confidence) / 2;
    const lower = Math.max(0, conversionProbability - delta);
    const upper = Math.min(1, conversionProbability + delta);

    const prediction: PredictionResult<{ conversionProbability: number; highSignalLikelihood: boolean }> = {
      id: `pred_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      modelVersion: this.modelVersion,
      predictedValue: {
        conversionProbability,
        highSignalLikelihood: conversionProbability > 0.65,
      },
      confidence: Number(confidence.toFixed(3)),
      uncertaintyInterval: [Number(lower.toFixed(3)), Number(upper.toFixed(3))],
      timestamp: Date.now(),
      context,
    };

    this.predictions.set(prediction.id, prediction);
    return prediction;
  }

  /**
   * Evaluates prediction vs reality, calculating Prediction Error and Surprise Score (-log P)
   */
  public recordOutcome(predictionId: string, actualOutcome: { converted: boolean }): {
    predictionError: number;
    surpriseScore: number;
  } | null {
    const pred = this.predictions.get(predictionId);
    if (!pred) return null;

    const predictedProb = (pred.predictedValue as any)?.conversionProbability || 0.5;
    const actualVal = actualOutcome.converted ? 1.0 : 0.0;
    const predictionError = Math.abs(actualVal - predictedProb);

    // Surprise Score: -log(P(actual))
    const pActual = actualOutcome.converted ? predictedProb : 1 - predictedProb;
    const safeP = Math.max(0.01, Math.min(0.99, pActual));
    const surpriseScore = Number((-Math.log(safeP)).toFixed(3));

    pred.actualOutcome = actualOutcome;
    pred.predictionError = Number(predictionError.toFixed(3));
    pred.surpriseScore = surpriseScore;

    return { predictionError, surpriseScore };
  }

  public getPrediction(id: string): PredictionResult | undefined {
    return this.predictions.get(id);
  }
}
