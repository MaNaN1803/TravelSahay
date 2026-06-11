import axios from 'axios';
import { ENV } from '@/lib/env';

/** Shared axios instance for the Travel Advisor (RapidAPI) backend. */
export const rapidClient = axios.create({
  baseURL: `https://${ENV.rapidApiHost}`,
  timeout: 20000,
  headers: {
    'X-RapidAPI-Key': ENV.rapidApiKey,
    'X-RapidAPI-Host': ENV.rapidApiHost,
  },
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
