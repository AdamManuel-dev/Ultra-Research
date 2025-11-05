/**
 * @fileoverview SSE event stream connector
 * @lastmodified 2025-11-05
 */

import { useEffect } from 'react';
import type { ResearchEvent } from '@deep-research/shared';

import { useAppDispatch } from '../hooks/useAppDispatch';
import { addEvent, setConnected } from '../store/slices/eventsSlice';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface EventStreamConnectorProps {
  runId: string;
}

const EventStreamConnector: React.FC<EventStreamConnectorProps> = ({ runId }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const eventSource = new EventSource(`${BASE_URL}/events/stream?run_id=${runId}`);

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      dispatch(setConnected(true));
    };

    eventSource.onmessage = (event) => {
      try {
        const data: ResearchEvent = JSON.parse(event.data);
        dispatch(addEvent(data));
      } catch (error) {
        console.error('Failed to parse event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      dispatch(setConnected(false));
      eventSource.close();
    };

    return () => {
      eventSource.close();
      dispatch(setConnected(false));
    };
  }, [runId, dispatch]);

  return null; // This is a connector component with no UI
};

export default EventStreamConnector;
