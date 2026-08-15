import { postFormData, postJson, postText } from './client';
import type {
  CsvIngestionRequest,
  DegradationSimulationRequest,
  EventIngestionRequest,
  ImageIngestionRequest,
  IngestionResponse,
  JsonIngestionRequest,
  RequestOptions,
  SensorIngestionRequest,
  TextIngestionRequest,
} from './types';

export function ingestText(
  body: TextIngestionRequest,
  options?: RequestOptions,
): Promise<IngestionResponse> {
  return typeof body === 'string'
    ? postText('/api/data/text', body, options)
    : postJson('/api/data/text', body, options);
}

export function ingestJson(
  body: JsonIngestionRequest,
  options?: RequestOptions,
): Promise<IngestionResponse> {
  return postJson('/api/data/json', body, options);
}

export function ingestCsv(
  body: CsvIngestionRequest,
  options?: RequestOptions,
): Promise<IngestionResponse> {
  return postFormData('/api/data/csv', body, options);
}

export function ingestImage(
  body: ImageIngestionRequest,
  options?: RequestOptions,
): Promise<IngestionResponse> {
  return postFormData('/api/data/image', body, options);
}

export function ingestSensor(
  body: SensorIngestionRequest,
  options?: RequestOptions,
): Promise<IngestionResponse> {
  return postJson('/api/data/sensor', body, options);
}

export function ingestEvent(
  body: EventIngestionRequest,
  options?: RequestOptions,
): Promise<IngestionResponse> {
  return postJson('/api/data/event', body, options);
}

export function simulateDegradation(
  body: DegradationSimulationRequest,
  options?: RequestOptions,
): Promise<IngestionResponse> {
  return postJson('/api/data/simulate-degradation', body, options);
}