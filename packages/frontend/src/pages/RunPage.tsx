/**
 * @fileoverview Run page showing live status and events
 * @lastmodified 2025-11-05
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import { ArrowBack, Pause, PlayArrow, Stop } from '@mui/icons-material';

import { useGetRunStatusQuery, usePauseRunMutation, useResumeRunMutation, useCancelRunMutation } from '../store/api';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { setActiveRun } from '../store/slices/runsSlice';
import StatusDashboard from '../components/StatusDashboard';
import EventLog from '../components/EventLog';
import TaskGraph from '../components/TaskGraph';
import EventStreamConnector from '../components/EventStreamConnector';

const RunPage: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: runStatus, error, isLoading, refetch } = useGetRunStatusQuery(runId!, {
    pollingInterval: 2000,
    skip: !runId,
  });

  const [pauseRun, { isLoading: isPausing }] = usePauseRunMutation();
  const [resumeRun, { isLoading: isResuming }] = useResumeRunMutation();
  const [cancelRun, { isLoading: isCancelling }] = useCancelRunMutation();

  useEffect(() => {
    if (runId) {
      dispatch(setActiveRun(runId));
    }
  }, [runId, dispatch]);

  const handlePause = async () => {
    if (!runId) return;
    try {
      await pauseRun(runId).unwrap();
      await refetch();
    } catch (err) {
      console.error('Failed to pause run:', err);
    }
  };

  const handleResume = async () => {
    if (!runId) return;
    try {
      await resumeRun(runId).unwrap();
      await refetch();
    } catch (err) {
      console.error('Failed to resume run:', err);
    }
  };

  const handleCancel = async () => {
    if (!runId) return;
    if (!confirm('Are you sure you want to cancel this run?')) return;
    try {
      await cancelRun(runId).unwrap();
      await refetch();
    } catch (err) {
      console.error('Failed to cancel run:', err);
    }
  };

  if (!runId) {
    return (
      <Container>
        <Alert severity="error">No run ID provided</Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !runStatus) {
    return (
      <Container>
        <Alert severity="error">
          Failed to load run status. The run may not exist.
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Alert>
      </Container>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'info';
      case 'running':
        return 'success';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'cancelled':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <>
      <EventStreamConnector runId={runId} />

      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            variant="outlined"
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" component="h1">
              {runStatus.query}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Run ID: {runId}
            </Typography>
          </Box>
          <Chip
            label={runStatus.status.toUpperCase()}
            color={getStatusColor(runStatus.status)}
            size="medium"
          />
          {runStatus.status === 'running' && (
            <Button
              startIcon={<Pause />}
              onClick={() => void handlePause()}
              disabled={isPausing}
              variant="outlined"
            >
              Pause
            </Button>
          )}
          {runStatus.status === 'paused' && (
            <Button
              startIcon={<PlayArrow />}
              onClick={() => void handleResume()}
              disabled={isResuming}
              variant="contained"
            >
              Resume
            </Button>
          )}
          {(runStatus.status === 'running' || runStatus.status === 'paused') && (
            <Button
              startIcon={<Stop />}
              onClick={() => void handleCancel()}
              disabled={isCancelling}
              variant="outlined"
              color="error"
            >
              Cancel
            </Button>
          )}
        </Box>

        {/* Status Dashboard */}
        <StatusDashboard runStatus={runStatus} />

        {/* Main Content Grid */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Task Graph */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 500 }}>
              <Typography variant="h6" gutterBottom>
                Task Graph
              </Typography>
              <TaskGraph stats={runStatus.stats} />
            </Paper>
          </Grid>

          {/* Event Log */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: 500 }}>
              <Typography variant="h6" gutterBottom>
                Live Event Log
              </Typography>
              <EventLog runId={runId} />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default RunPage;
