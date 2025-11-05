/**
 * @fileoverview Runs slice for managing run state
 * @lastmodified 2025-11-05
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface RunsState {
  activeRunId?: string;
  recentRuns: string[];
}

const initialState: RunsState = {
  recentRuns: [],
};

const runsSlice = createSlice({
  name: 'runs',
  initialState,
  reducers: {
    setActiveRun: (state, action: PayloadAction<string>) => {
      state.activeRunId = action.payload;
      if (!state.recentRuns.includes(action.payload)) {
        state.recentRuns.unshift(action.payload);
        // Keep only last 10 runs
        state.recentRuns = state.recentRuns.slice(0, 10);
      }
    },
    clearActiveRun: (state) => {
      state.activeRunId = undefined;
    },
  },
});

export const { setActiveRun, clearActiveRun } = runsSlice.actions;
export default runsSlice.reducer;
