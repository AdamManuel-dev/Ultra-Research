/**
 * @fileoverview 404 Not Found page
 * @lastmodified 2025-11-05
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, Button } from '@mui/material';
import { Home } from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container>
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h1" component="h1" gutterBottom>
          404
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Page not found
        </Typography>
        <Button
          variant="contained"
          startIcon={<Home />}
          onClick={() => navigate('/')}
          sx={{ mt: 2 }}
        >
          Go Home
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
