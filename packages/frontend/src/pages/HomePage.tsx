/**
 * @fileoverview Home page with run starter
 * @lastmodified 2025-11-05
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PlayArrow } from '@mui/icons-material';

import { useStartRunMutation } from '../store/api';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [strategy, setStrategy] = useState<'simple' | 'breadth-first' | 'depth-first' | 'adaptive'>('simple');
  const [startRun, { isLoading, error }] = useStartRunMutation();

  const handleStart = async () => {
    if (!query.trim()) return;

    try {
      const result = await startRun({ query, strategy }).unwrap();
      navigate(`/run/${result.runId}`);
    } catch (err) {
      console.error('Failed to start run:', err);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          Deep Research Cockpit
        </Typography>
        <Typography variant="h6" color="text.secondary" align="center" paragraph>
          Start a new research exploration
        </Typography>
      </Box>

      <Paper sx={{ p: 4 }}>
        <Box component="form" onSubmit={(e) => { e.preventDefault(); void handleStart(); }}>
          <TextField
            fullWidth
            label="Research Query"
            placeholder="What would you like to research?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            margin="normal"
            multiline
            rows={3}
            disabled={isLoading}
            autoFocus
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Strategy</InputLabel>
            <Select
              value={strategy}
              label="Strategy"
              onChange={(e) => setStrategy(e.target.value as typeof strategy)}
              disabled={isLoading}
            >
              <MenuItem value="simple">Simple (Linear Pipeline)</MenuItem>
              <MenuItem value="breadth-first">Breadth-First (Parallel Exploration)</MenuItem>
              <MenuItem value="depth-first">Depth-First (Deep Dive)</MenuItem>
              <MenuItem value="adaptive">Adaptive (Dynamic Branching)</MenuItem>
            </Select>
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Failed to start research run. Please try again.
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            startIcon={isLoading ? <CircularProgress size={20} /> : <PlayArrow />}
            disabled={!query.trim() || isLoading}
            sx={{ mt: 3 }}
          >
            {isLoading ? 'Starting...' : 'Start Research'}
          </Button>
        </Box>
      </Paper>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          The system will automatically search, fetch, extract, index, retrieve, and synthesize information
          based on your query using the selected strategy.
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;
