/**
 * @fileoverview Live event log viewer
 * @lastmodified 2025-11-05
 */

import React, { useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Badge,
} from '@mui/material';
import { Circle } from '@mui/icons-material';

import { useAppSelector } from '../hooks/useAppSelector';

interface EventLogProps {
  runId: string;
}

const EventLog: React.FC<EventLogProps> = ({ runId }) => {
  const { events, connected } = useAppSelector((state) => state.events);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter events for this run
  const runEvents = events.filter((event) => event.run_id === runId);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [runEvents.length]);

  const getActionColor = (action: string) => {
    if (action.includes('start')) return 'info';
    if (action.includes('complete')) return 'success';
    if (action.includes('error') || action.includes('failed')) return 'error';
    if (action.includes('scheduled')) return 'warning';
    return 'default';
  };

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Connection Status */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Badge
          color={connected ? 'success' : 'error'}
          variant="dot"
          sx={{ '& .MuiBadge-badge': { animation: connected ? 'pulse 2s infinite' : 'none' } }}
        >
          <Circle sx={{ fontSize: 12, color: connected ? 'success.main' : 'error.main' }} />
        </Badge>
        <Typography variant="caption" color="text.secondary">
          {connected ? 'Connected' : 'Disconnected'} • {runEvents.length} events
        </Typography>
      </Box>

      {/* Event List */}
      <Box
        ref={listRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
          },
        }}
      >
        {runEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Waiting for events...
            </Typography>
          </Box>
        ) : (
          <List dense>
            {runEvents.map((event, index) => (
              <ListItem
                key={`${event.ts}-${index}`}
                sx={{
                  borderLeft: 3,
                  borderColor: 'divider',
                  mb: 1,
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Chip
                        label={event.action}
                        size="small"
                        color={getActionColor(event.action)}
                        sx={{ fontSize: '0.7rem' }}
                      />
                      <Chip
                        label={event.agent}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Step {event.step_id}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Box>
                      {event.input && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Input: {JSON.stringify(event.input).substring(0, 100)}
                          {JSON.stringify(event.input).length > 100 && '...'}
                        </Typography>
                      )}
                      {event.output && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Output: {JSON.stringify(event.output).substring(0, 100)}
                          {JSON.stringify(event.output).length > 100 && '...'}
                        </Typography>
                      )}
                      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                        {formatTime(event.ts)}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default EventLog;
