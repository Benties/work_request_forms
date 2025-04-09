import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ImageList,
  ImageListItem,
  ImageListItemBar
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
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

const QuestionForm = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');
  const requestId = searchParams.get('requestId');
  const formId = searchParams.get('formId');
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<Attachment | null>(null);
  const [editingAttachment, setEditingAttachment] = useState<Attachment | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!requestId || !formId || !id) {
        setError('Missing required parameters: requestId, formId, or questionId');
        setLoading(false);
        return;
      }

      try {
        // Fetch question
        const questionResponse = await api.getQuestion(id);
        setQuestion(questionResponse.data[0]);

        // Fetch existing answer
        const answerResponse = await api.getAnswer(id, requestId);
        if (answerResponse.data && answerResponse.data.length > 0) {
          setAnswer(answerResponse.data[0]);
          setAnswerText(String(answerResponse.data[0][FIELDS.ANSWERS.ANSWER].value));

          // Fetch attachments for the answer
          const attachmentsResponse = await api.getAttachmentsForAnswer(
            Number(answerResponse.data[0][FIELDS.ANSWERS.RECORD_ID].value)
          );
          console.log(attachmentsResponse.data);
          setAttachments(attachmentsResponse.data);
        }
      } catch (error) {
        setError('Failed to load data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, requestId, formId]);

  const handlePreviewOpen = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setSelectedAttachment(null);
  };

  const handleEditAttachment = (attachment: Attachment) => {
    setEditingAttachment(attachment);
  };

  const handleEditFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpdateAttachment = async () => {
    if (!editingAttachment || !file || !answer) {
      setError('Missing required data for update');
      return;
    }

    try {
      const answerId = Number(answer[FIELDS.ANSWERS.RECORD_ID].value);
      const attachmentId = Number(editingAttachment[FIELDS.ATTACHMENTS.RECORD_ID].value);

      console.log('Updating attachment:', {
        answerId,
        fileName: file.name,
        attachmentId
      });

      await api.uploadFileAttachment(
        answerId,
        file.name,
        file,
        attachmentId
      );

      // Refresh attachments
      const updatedAttachments = await api.getAttachmentsForAnswer(answerId);
      console.log('Updated attachments:', updatedAttachments.data);
      setAttachments(updatedAttachments.data);
      setFile(null);
      setEditingAttachment(null);
    } catch (error) {
      setError('Failed to update attachment');
      console.error('Error updating attachment:', error);
    }
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

  const handleDeleteAttachment = async (recordId: number) => {
    try {
      console.log('Deleting attachment:', recordId);
      await api.deleteAttachment(recordId);
      setAttachments(attachments.filter(att => att[FIELDS.ATTACHMENTS.RECORD_ID].value !== recordId));
    } catch (error) {
      setError('Failed to delete attachment');
      console.error('Error deleting attachment:', error);
    }
  };

  const getAttachmentFileName = (attachment: Attachment) => {
    const fileAttachment = attachment[FIELDS.ATTACHMENTS.FILE_ATTACHMENT]?.value;
    if (typeof fileAttachment === 'object' && fileAttachment?.versions?.length > 0) {
      // Get the last version in the array (most recent)
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!userId || !requestId || !formId || !id) {
      setError('Missing required parameters');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let answerResponse;
      let answerRecordId: number;

      if (answer) {
        // Update existing answer
        answerResponse = await api.updateAnswer(
          String(answer[FIELDS.ANSWERS.RECORD_ID].value),
          answerText,
          userId,
          requestId
        );
        // For updates, get the record ID from metadata
        answerRecordId = Number(answer[FIELDS.ANSWERS.RECORD_ID].value);
      } else {
        // Create new answer
        answerResponse = await api.saveAnswer(
          id,
          answerText,
          userId,
          requestId
        );
        // For new answers, get the record ID from metadata.createdRecordIds
        console.log('Answer response:', answerResponse);
        if (!answerResponse.metadata?.createdRecordIds?.[0]) {
          throw new Error('Invalid response format from saveAnswer');
        }
        answerRecordId = answerResponse.metadata.createdRecordIds[0];
      }

      if (!answerRecordId) {
        throw new Error('Failed to get answer record ID');
      }

      // Upload file if selected
      if (file) {
        await api.uploadFileAttachment(
          answerRecordId,
          file.name,
          file
        );
      }

      setSuccess(true);
      setTimeout(() => navigate(`/questions?userId=${userId}&requestId=${requestId}&formId=${formId}`), 2000);
    } catch (error) {
      setError('Failed to save answer');
      console.error('Error saving answer:', error);
    } finally {
      setSaving(false);
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

  if (!question) {
    return (
      <Alert severity="error">
        Question not found
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">
          {String(question[FIELDS.QUESTIONS.QUESTION].value)}
        </Typography>
        {answer && (
          <Chip
            label="Previously Answered"
            color="success"
            variant="outlined"
          />
        )}
      </Box>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          label="Your Answer"
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          margin="normal"
          required={question[FIELDS.QUESTIONS.REQUIRED].value as boolean}
        />
        <Box sx={{ mt: 2, mb: 2 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />
          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
            >
              Upload Attachment
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected file: {file.name}
            </Typography>
          )}
        </Box>

        {attachments.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Attachments:</Typography>
            <ImageList cols={3} rowHeight={164}>
              {attachments.map((attachment) => {
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
                              padding: '8px'
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
                              variant="body2"
                              sx={{
                                color: 'white',
                                textAlign: 'center',
                                px: 2
                              }}
                            >
                              Click to view
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <>
                          {getFileIcon(fileName)}
                          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', px: 1 }}>
                            {fileName || 'Unknown File'}
                          </Typography>
                        </>
                      )}
                    </Box>
                    <ImageListItemBar
                      position="top"
                      actionIcon={
                        <Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAttachment(attachment);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAttachment(Number(attachment[FIELDS.ATTACHMENTS.RECORD_ID].value));
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      }
                    />
                  </ImageListItem>
                );
              })}
            </ImageList>
          </Box>
        )}

        {/* Preview Dialog */}
        <Dialog
          open={previewOpen}
          onClose={handlePreviewClose}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {selectedAttachment && getAttachmentFileName(selectedAttachment) || 'Preview'}
          </DialogTitle>
          <DialogContent>
            {selectedAttachment && (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center' }}>
                {getAttachmentFileName(selectedAttachment)?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={getAttachmentUrl(selectedAttachment)}
                    alt={getAttachmentFileName(selectedAttachment) || 'Image'}
                    style={{ maxWidth: '100%', maxHeight: '70vh' }}
                  />
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography>
                      Preview not available for this file type.
                      <br />
                      File name: {getAttachmentFileName(selectedAttachment) || 'Unknown File'}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handlePreviewClose}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Edit Attachment Dialog */}
        <Dialog
          open={!!editingAttachment}
          onClose={() => setEditingAttachment(null)}
        >
          <DialogTitle>Edit Attachment</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="edit-file-upload"
                type="file"
                onChange={handleEditFileChange}
              />
              <label htmlFor="edit-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                >
                  Select New File
                </Button>
              </label>
              {file && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {file.name}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditingAttachment(null)}>Cancel</Button>
            <Button
              onClick={handleUpdateAttachment}
              variant="contained"
              disabled={!file}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Answer saved successfully!
          </Alert>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : answer ? 'Update Answer' : 'Save Answer'}
        </Button>
      </form>
    </Paper>
  );
};

export default QuestionForm;
