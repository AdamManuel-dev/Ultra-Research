/**
 * @fileoverview Main App component with routing
 * @lastmodified 2025-11-05
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';

import HomePage from './pages/HomePage';
import RunPage from './pages/RunPage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/run/:runId" element={<RunPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Box>
  );
};

export default App;
