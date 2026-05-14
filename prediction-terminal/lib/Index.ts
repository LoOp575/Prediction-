// types/index.ts

export type Draw = {
  date: string;
  result: string;
  digits: number[];
};

export type FrequencyResult = {
  digit: number;
  count: number;
  probability: number;
};

export type PredictionResult = {
  number: string;
  score: number;
  probability: number;
  reason: string;
};

export type AnalysisResult = {
  market: string;
  totalDraws: number;
  frequency: FrequencyResult[];
  predictions: PredictionResult[];
};
