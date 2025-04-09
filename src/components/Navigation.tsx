import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';

const Navigation = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const requestId = searchParams.get('requestId');
  const formId = searchParams.get('formId');

  const getQuestionsUrl = () => {
    // if (userId && requestId && formId) {
    return `/questions?userId=${userId}&requestId=${requestId}&formId=${formId}`;
    // }
    // return '/';
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Work Request Form
        </Typography>
        <Box>
          <Button
            color="inherit"
            component={RouterLink}
            to={getQuestionsUrl()}
          >
            Questions
          </Button>
          {/* <Button
            color="inherit"
            component={RouterLink}
            to="/progress"
          >
            Progress
          </Button> */}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
