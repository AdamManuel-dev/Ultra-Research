/**
 * @fileoverview Status dashboard showing run metrics
 * @lastmodified 2025-11-05
 */

import React from 'react';
import { Paper, Grid, Box, Typography, LinearProgress } from '@mui/material';
import {
  CheckCircle,
  PlayCircle,
  PendingActions,
  Error,
  Cancel,
} from '@mui/icons-material';

import type { RunStatus } from '../store/api';

interface StatusDashboardProps {
  runStatus: RunStatus;
}

const StatusDashboard: React.FC<StatusDashboardProps> = ({ runStatus }) => {
  const { stats, duration } = runStatus;

  const progress = stats.totalTasks > 0
    ? ((stats.completedTasks + stats.failedTasks + stats.cancelledTasks) / stats.totalTasks) * 100
    : 0;

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ color, fontSize: 40 }}>{icon}</Box>
      <Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </Box>
    </Paper>
  );

  return (
    <Box>
      {/* Progress Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="body2">Overall Progress</Typography>
          <Typography variant="body2">{progress.toFixed(1)}%</Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 1 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {stats.completedTasks} / {stats.totalTasks} tasks completed
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Duration: {formatDuration(duration)}
          </Typography>
        </Box>
      </Paper>

      {/* Stats Grid */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Completed"
            value={stats.completedTasks}
            icon={<CheckCircle />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Running"
            value={stats.runningTasks}
            icon={<PlayCircle />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Pending"
            value={stats.pendingTasks}
            icon={<PendingActions />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Failed"
            value={stats.failedTasks}
            icon={<Error />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Cancelled"
            value={stats.cancelledTasks}
            icon={<Cancel />}
            color="text.secondary"
          />
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Paper sx={{ p: 2, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Total Tasks
            </Typography>
            <Typography variant="h6">{stats.totalTasks}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Graph Depth
            </Typography>
            <Typography variant="h6">{stats.depth}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Ready
            </Typography>
            <Typography variant="h6">{stats.readyTasks}</Typography>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Typography variant="body2" color="text.secondary">
              Success Rate
            </Typography>
            <Typography variant="h6">
              {stats.totalTasks > 0
                ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1)
                : 0}
              %
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default StatusDashboard;
