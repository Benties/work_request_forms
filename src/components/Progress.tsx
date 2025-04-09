import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Box,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { api } from '../config/quickbase.ts';

interface Progress {
  question_id: string;
  status: string;
}

const Progress = () => {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await api.getProgress('current-user-id'); // Replace with actual user ID from QuickBase context
        setProgress(response.data);
      } catch (error) {
        console.error('Error fetching progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, []);

  const completedCount = progress.filter(p => p.status === 'completed').length;
  const totalCount = progress.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Your Progress
      </Typography>
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" gutterBottom>
          Completed: {completedCount} / {totalCount} questions
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progressPercentage}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Box>
      <List>
        {progress.map((item) => (
          <ListItem key={item.question_id} disablePadding>
            <ListItemButton onClick={() => navigate(`/question/${item.question_id}`)}>
              <ListItemText
                primary={`Question ${item.question_id}`}
                secondary={`Status: ${item.status}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default Progress;
