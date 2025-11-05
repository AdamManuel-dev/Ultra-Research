/**
 * @fileoverview Events slice for managing event stream state
 * @lastmodified 2025-11-05
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ResearchEvent } from '@deep-research/shared';

interface EventsState {
  events: ResearchEvent[];
  connected: boolean;
  lastEventTime?: string;
  filter: {
    runId?: string;
    agent?: string;
    action?: string;
  };
}

const initialState: EventsState = {
  events: [],
  connected: false,
  filter: {},
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    addEvent: (state, action: PayloadAction<ResearchEvent>) => {
      state.events.push(action.payload);
      state.lastEventTime = action.payload.ts;
      // Keep only last 1000 events
      if (state.events.length > 1000) {
        state.events = state.events.slice(-1000);
      }
    },
    clearEvents: (state) => {
      state.events = [];
      state.lastEventTime = undefined;
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<EventsState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    clearFilter: (state) => {
      state.filter = {};
    },
  },
});

export const { addEvent, clearEvents, setConnected, setFilter, clearFilter } = eventsSlice.actions;
export default eventsSlice.reducer;
