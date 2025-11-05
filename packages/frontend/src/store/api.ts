/**
 * @fileoverview RTK Query API definitions
 * @lastmodified 2025-11-05
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface RunStatus {
  runId: string;
  query: string;
  status: 'planning' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  stats: {
    totalTasks: number;
    pendingTasks: number;
    readyTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    cancelledTasks: number;
    depth: number;
  };
  duration?: number;
}

export interface StartRunRequest {
  query: string;
  strategy?: 'simple' | 'breadth-first' | 'depth-first' | 'adaptive';
  userId?: string;
}

export interface StartRunResponse {
  runId: string;
  query: string;
  status: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ['Run', 'Events'],
  endpoints: (builder) => ({
    // Orchestrator endpoints
    startRun: builder.mutation<StartRunResponse, StartRunRequest>({
      query: (body) => ({
        url: '/orchestrator/runs',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Run'],
    }),
    getRunStatus: builder.query<RunStatus, string>({
      query: (runId) => `/orchestrator/runs/${runId}`,
      providesTags: (_result, _error, runId) => [{ type: 'Run', id: runId }],
    }),
    pauseRun: builder.mutation<void, string>({
      query: (runId) => ({
        url: `/orchestrator/runs/${runId}/pause`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, runId) => [{ type: 'Run', id: runId }],
    }),
    resumeRun: builder.mutation<void, string>({
      query: (runId) => ({
        url: `/orchestrator/runs/${runId}/resume`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, runId) => [{ type: 'Run', id: runId }],
    }),
    cancelRun: builder.mutation<void, string>({
      query: (runId) => ({
        url: `/orchestrator/runs/${runId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, runId) => [{ type: 'Run', id: runId }],
    }),
  }),
});

export const {
  useStartRunMutation,
  useGetRunStatusQuery,
  usePauseRunMutation,
  useResumeRunMutation,
  useCancelRunMutation,
} = api;
