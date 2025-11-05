/**
 * @fileoverview Task graph visualization
 * @lastmodified 2025-11-05
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

import type { RunStatus } from '../store/api';

interface TaskGraphProps {
  stats: RunStatus['stats'];
}

const TaskGraph: React.FC<TaskGraphProps> = ({ stats }) => {
  const data = [
    { name: 'Completed', value: stats.completedTasks, color: '#4caf50' },
    { name: 'Running', value: stats.runningTasks, color: '#2196f3' },
    { name: 'Ready', value: stats.readyTasks, color: '#ff9800' },
    { name: 'Pending', value: stats.pendingTasks, color: '#9e9e9e' },
    { name: 'Failed', value: stats.failedTasks, color: '#f44336' },
    { name: 'Cancelled', value: stats.cancelledTasks, color: '#757575' },
  ].filter((item) => item.value > 0);

  if (stats.totalTasks === 0) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          No tasks yet
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 'calc(100% - 32px)' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TaskGraph;
