import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Paper,
  CircularProgress,
  Box,
  Alert,
  Chip,
  Divider,
  ListItemSecondaryAction,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Button
} from '@mui/material';
import {
  Edit as EditIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocumentIcon
} from '@mui/icons-material';
import { api, FIELDS } from '../config/quickbase.ts';

interface QuickBaseField {
  value: string | boolean;
}

interface Question {
  [key: number]: QuickBaseField;
}

interface Answer {
  [key: number]: QuickBaseField;
}

interface Attachment {
  record_id: number;
  [key: number]: {
    value: number | {
      url: string;
      versions: Array<{
        creator: {
          email: string;
          id: string;
          name: string;
          userName: string;
        };
        fileName: string;
        uploaded: string;
        versionNumber: number;
      }>;
    };
  };
}

const QuestionList = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const requestId = searchParams.get('requestId');
  const formId = searchParams.get('formId');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<{ [key: string]: Answer }>({});
  const [attachments, setAttachments] = useState<{ [key: string]: Attachment[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId || !formId) {
        setError('Missing required parameters: requestId or formId');
        setLoading(false);
        return;
      }

      try {
        // Fetch questions
        const questionsResponse = await api.getQuestions(formId);
        setQuestions(questionsResponse.data);

        // Fetch answers for all questions
        const answersPromises = questionsResponse.data.map(async (question) => {
          const answerResponse = await api.getAnswer(
            String(question[FIELDS.QUESTIONS.RECORD_ID].value),
            requestId
          );
          if (answerResponse.data && answerResponse.data.length > 0) {
            const answer = answerResponse.data[0];
            const answerId = String(answer[FIELDS.ANSWERS.RECORD_ID].value);

            // Fetch attachments for this answer
            const attachmentsResponse = await api.getAttachmentsForAnswer(
              Number(answer[FIELDS.ANSWERS.RECORD_ID].value)
            );

            return {
              questionId: String(question[FIELDS.QUESTIONS.RECORD_ID].value),
              answer,
              attachments: attachmentsResponse.data
            };
          }
          return null;
        });

        const results = await Promise.all(answersPromises);
        const newAnswers: { [key: string]: Answer } = {};
        const newAttachments: { [key: string]: Attachment[] } = {};

        results.forEach((result) => {
          if (result) {
            newAnswers[result.questionId] = result.answer;
            newAttachments[result.questionId] = result.attachments;
          }
        });

        setAnswers(newAnswers);
        setAttachments(newAttachments);
      } catch (error) {
        setError('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [requestId, formId]);

  const handleEdit = (questionId: string) => {
    navigate(`/question/${questionId}?userId=${userId}&requestId=${requestId}&formId=${formId}`);
  };

  const getFileIcon = (fileName: string | undefined) => {
    if (!fileName) return <DocumentIcon />;

    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon />;
      case 'pdf':
        return <PdfIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  const getAttachmentFileName = (attachment: Attachment) => {
    const fileAttachment = attachment[FIELDS.ATTACHMENTS.FILE_ATTACHMENT]?.value;
    if (typeof fileAttachment === 'object' && fileAttachment?.versions?.length > 0) {
      const latestVersion = fileAttachment.versions[fileAttachment.versions.length - 1];
      return latestVersion.fileName;
    }
    return undefined;
  };

  const getAttachmentUrl = (attachment: Attachment) => {
    const urlField = attachment[8]?.value;
    if (typeof urlField === 'string') {
      return urlField;
    }
    return undefined;
  };

  const handleAttachmentClick = (attachment: Attachment) => {
    const url = getAttachmentUrl(attachment);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Questions
        </Typography>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Progress
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                flex: 1,
                height: 8,
                bgcolor: 'grey.200',
                borderRadius: 4,
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  bgcolor: 'primary.main',
                  width: `${(Object.keys(answers).length / questions.length) * 100}%`,
                  transition: 'width 0.3s ease-in-out'
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {Object.keys(answers).length} of {questions.length} questions answered
            </Typography>
          </Box>
        </Box>
      </Box>
      <List>
        {questions.map((question) => {
          const questionId = String(question[FIELDS.QUESTIONS.RECORD_ID].value);
          const answer = answers[questionId];
          const questionAttachments = attachments[questionId] || [];
          const isRequired = question[FIELDS.QUESTIONS.REQUIRED].value as boolean;

          return (
            <ListItem
              key={questionId}
              divider
              sx={{
                flexDirection: 'column',
                alignItems: 'flex-start',
                py: 2
              }}
            >
              <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="subtitle1" component="div">
                      {String(question[FIELDS.QUESTIONS.QUESTION].value)}
                    </Typography>
                    {isRequired && (
                      <Typography component="span" color="error" variant="caption">
                        *
                      </Typography>
                    )}
                  </Box>
                  {answer ? (
                    <Box>
                      <Typography
                        component="div"
                        variant="body2"
                        color="text.primary"
                        sx={{ whiteSpace: 'pre-wrap', mb: 1 }}
                      >
                        {String(answer[FIELDS.ANSWERS.ANSWER].value)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Answered by: {String(answer[FIELDS.ANSWERS.USER_EMAIL].value)}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Not answered
                    </Typography>
                  )}
                </Box>
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(questionId)}
                  >
                    {answer ? 'Edit' : 'Answer'}
                  </Button>
                </ListItemSecondaryAction>
              </Box>

              {questionAttachments.length > 0 && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    Attachments:
                  </Typography>
                  <ImageList cols={4} rowHeight={120}>
                    {questionAttachments.map((attachment) => {
                      const fileName = getAttachmentFileName(attachment);
                      return (
                        <ImageListItem key={Number(attachment[FIELDS.ATTACHMENTS.RECORD_ID].value)}>
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'grey.100',
                              cursor: 'pointer',
                              position: 'relative',
                              overflow: 'hidden',
                              '&:hover': {
                                '& .overlay': {
                                  opacity: 1,
                                },
                              },
                            }}
                            onClick={() => handleAttachmentClick(attachment)}
                          >
                            {fileName?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <>
                                <img
                                  src={getAttachmentUrl(attachment)}
                                  alt={fileName}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    padding: '4px'
                                  }}
                                />
                                <Box
                                  className="overlay"
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: 'white',
                                      textAlign: 'center',
                                      px: 1
                                    }}
                                  >
                                    Click to view
                                  </Typography>
                                </Box>
                              </>
                            ) : (
                              <>
                                {getFileIcon(fileName)}
                                <Typography variant="caption" sx={{ mt: 0.5, textAlign: 'center', px: 1 }}>
                                  {fileName || 'Unknown File'}
                                </Typography>
                              </>
                            )}
                          </Box>
                        </ImageListItem>
                      );
                    })}
                  </ImageList>
                </Box>
              )}
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default QuestionList;
