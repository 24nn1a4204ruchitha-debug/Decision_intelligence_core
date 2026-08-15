/**
 * The handoff defines endpoint paths but does not include the FastAPI
 * Pydantic schemas. Keep the wire types open until those schemas are shared.
 * This preserves the real response instead of guessing field names.
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue | undefined };
export type JsonBody = JsonValue;

export type ApiRecord = Record<string, unknown>;
export type ApiRecords = ApiRecord[];

export type RequestOptions = {
  signal?: AbortSignal;
  headers?: HeadersInit;
};

export type AuthRegisterRequest = JsonObject;
export type AuthLoginRequest = JsonObject;
export type AuthRegisterResponse = ApiRecord;
export type AuthLoginResponse = ApiRecord;
export type AuthMeResponse = ApiRecord;

export type TextIngestionRequest = string | JsonObject;
export type JsonIngestionRequest = JsonValue;
export type CsvIngestionRequest = FormData;
export type ImageIngestionRequest = FormData;
export type SensorIngestionRequest = JsonObject;
export type EventIngestionRequest = JsonObject;
export type DegradationSimulationRequest = JsonObject;

export type IngestionResponse = ApiRecord;
export type PredictionRequest = JsonObject;
export type PredictionResponse = ApiRecord;
export type AnomalyDetectionRequest = JsonObject;
export type AnomalyResponse = ApiRecord;
export type AnomalyListResponse = ApiRecords | ApiRecord;
export type DecisionEvaluationRequest = JsonObject;
export type DecisionResponse = ApiRecord;

export type PendingReviewsResponse = ApiRecords | ApiRecord;
export type ReviewActionRequest = JsonObject;
export type ReviewActionResponse = ApiRecord;
export type FeedbackRequest = JsonObject;
export type FeedbackResponse = ApiRecord;

export type ModelPerformanceResponse = ApiRecord;
export type ModelRetrainRequest = JsonObject;
export type ModelRetrainResponse = ApiRecord;

export type DashboardOverviewResponse = ApiRecord;
export type DashboardRecentDecisionsResponse = ApiRecords | ApiRecord;
export type DashboardRecentAnomaliesResponse = ApiRecords | ApiRecord;
export type DashboardSystemHealthResponse = ApiRecord;

export type AuditResponse = ApiRecord;
export type DemoResponse = ApiRecord;

export type EventPayload = ApiRecord;