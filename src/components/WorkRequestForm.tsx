import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { api } from '../config/quickbase.ts';

const WorkRequestForm = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [priority, setPriority] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!subject || !priority) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.createWorkRequest(subject, priority);
      console.log(response);
      // Navigate to question list with the returned IDs
      navigate(`/questions?userId=${response.data[0][4].value.email}&requestId=${response.data[0][3].value}&formId=${response.data[0][32].value}`);
    } catch (error) {
      setError('Failed to create work request');
      console.error('Error creating work request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 2
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          New Work Request
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Please provide the following details to create your work request.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            margin="normal"
            error={!!error && !subject}
            helperText={error && !subject ? 'Subject is required' : ''}
          />

          <FormControl fullWidth margin="normal" required error={!!error && !priority}>
            <InputLabel>Priority Level</InputLabel>
            <Select
              value={priority}
              label="Priority Level"
              onChange={(e) => setPriority(e.target.value)}
            >
              <MenuItem value="Low">Low</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="High">High</MenuItem>
            </Select>
            {error && !priority && (
              <Typography color="error" variant="caption">
                Priority level is required
              </Typography>
            )}
          </FormControl>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              size="large"
            >
              {loading ? <CircularProgress size={24} /> : 'Next'}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default WorkRequestForm;
