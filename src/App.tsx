import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Navigation from './components/Navigation.tsx';
import QuestionList from './components/QuestionList.tsx';
import QuestionForm from './components/QuestionForm.tsx';
import WorkRequestForm from './components/WorkRequestForm.tsx';
import Progress from './components/Progress.tsx';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/db/buzzytkvg">
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation />
          <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
            <Routes>
              <Route path="/" element={<WorkRequestForm />} />
              <Route path="/questions" element={<QuestionList />} />
              <Route path="/question/:id" element={<QuestionForm />} />
              <Route path="/progress" element={<Progress />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
