// QuickBase API configuration
const QB_API_URL = 'https://api.quickbase.com/v1';
const QB_APP_TOKEN = "dwzpakaksstaqdqjwgbzbfypbpx";
const QB_REALM_HOSTNAME = window.QUICKBASE_REALM;

// Headers for QuickBase API requests
const getHeaders = (temporaryToken?: string) => ({
  'QB-Realm-Hostname': QB_REALM_HOSTNAME,
  'User-Agent': 'QuestionAnswerPlatform/1.0',
  'Authorization': `QB-TEMP-TOKEN ${temporaryToken}`,
  'Content-Type': 'application/json'
})

// Function to get temporary token
const getTemporaryToken = async (tableId: string) => {
  try {
    const response = await fetch(`${QB_API_URL}/auth/temporary/${tableId}`, {
      method: 'GET',
      headers: {
        'QB-Realm-Hostname': QB_REALM_HOSTNAME,
        'User-Agent': 'QuestionAnswerPlatform/1.0',
        'QB-App-Token': QB_APP_TOKEN,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get temporary token');
    }

    const data = await response.json();
    return data["temporaryAuthorization"];
  } catch (error) {
    console.error('Error getting temporary token:', error);
    throw error;
  }
};

// Table IDs - Replace these with your actual QuickBase table IDs
export const TABLES = {
  QUESTIONS: 'buzzze3pn',
  ANSWERS: 'buzzzhvkj',
  ATTACHMENTS: 'buz3i82er'
};

// Field IDs mapping by table
export const FIELDS = {
  QUESTIONS: {
    RECORD_ID: 3,
    QUESTION: 6,
    REQUIRED: 7,
    FORM_ID: 10
  },
  ANSWERS: {
    RECORD_ID: 3,
    QUESTION_ID: 10,
    ANSWER: 6,
    USER_ID: 7,
    USER_EMAIL: 8,
    REQUEST_ID: 12,
  },
  ATTACHMENTS: {
    RECORD_ID: 3,
    ANSWER_ID: 6,
    FILE_ATTACHMENT: 7
  }
};

// Types for file attachment data
interface FileVersion {
  versionNumber: number;
  fileName: string;
  uploaded: string;
  creator: {
    email: string;
    id: string;
    name: string;
    userName: string;
  };
}

interface FileAttachment {
  url: string;
  reservedBy?: {
    email: string;
    id: string;
    name: string;
    userName: string;
  };
  versions: FileVersion[];
}

interface FileAttachmentValue {
  value: FileAttachment;
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

// API functions
export const api = {
  // Get all active questions for a specific form
  getQuestions: async (formId: string) => {
    const temporaryToken = await getTemporaryToken(TABLES.QUESTIONS);
    const response = await fetch(`${QB_API_URL}/records/query`, {
      method: 'POST',
      headers: getHeaders(temporaryToken),
      body: JSON.stringify({
        from: TABLES.QUESTIONS,
        select: [FIELDS.QUESTIONS.RECORD_ID, FIELDS.QUESTIONS.QUESTION, FIELDS.QUESTIONS.REQUIRED],
        where: `{${FIELDS.QUESTIONS.FORM_ID}.EX.'${formId}'}`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch questions');
    }

    return response.json();
  },

  // Get a single question
  getQuestion: async (questionId: string) => {
    const temporaryToken = await getTemporaryToken(TABLES.QUESTIONS);
    const response = await fetch(`${QB_API_URL}/records/query`, {
      method: 'POST',
      headers: getHeaders(temporaryToken),
      body: JSON.stringify({
        from: TABLES.QUESTIONS,
        select: [FIELDS.QUESTIONS.RECORD_ID, FIELDS.QUESTIONS.QUESTION, FIELDS.QUESTIONS.REQUIRED],
        where: `{${FIELDS.QUESTIONS.RECORD_ID}.EX.'${questionId}'}`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch question');
    }

    return response.json();
  },

  // Get an answer for a specific question and request
  getAnswer: async (questionId: string, requestId: string) => {
    const temporaryToken = await getTemporaryToken(TABLES.ANSWERS);
    const response = await fetch(`${QB_API_URL}/records/query`, {
      method: 'POST',
      headers: getHeaders(temporaryToken),
      body: JSON.stringify({
        from: TABLES.ANSWERS,
        select: [FIELDS.ANSWERS.RECORD_ID, FIELDS.ANSWERS.ANSWER, FIELDS.ANSWERS.USER_EMAIL, FIELDS.ANSWERS.USER_ID],
        where: `{${FIELDS.ANSWERS.QUESTION_ID}.EX.'${questionId}'}AND{${FIELDS.ANSWERS.REQUEST_ID}.EX.'${requestId}'}`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch answer');
    }

    return response.json();
  },

  // Save an answer
  saveAnswer: async (questionId: string, answer: string, userId: string, requestId: string) => {
    const temporaryToken = await getTemporaryToken(TABLES.ANSWERS);
    const response = await fetch(`${QB_API_URL}/records`, {
      method: 'POST',
      headers: getHeaders(temporaryToken),
      body: JSON.stringify({
        to: TABLES.ANSWERS,
        data: [{
          [FIELDS.ANSWERS.QUESTION_ID]: { value: questionId },
          [FIELDS.ANSWERS.ANSWER]: { value: answer },
          [FIELDS.ANSWERS.USER_ID]: { value: userId },
          [FIELDS.ANSWERS.REQUEST_ID]: { value: requestId }
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to save answer');
    }

    return response.json();
  },

  // Get user's progress
  getProgress: async (requestId: string) => {
    const temporaryToken = await getTemporaryToken(TABLES.ANSWERS);
    const response = await fetch(`${QB_API_URL}/records/query`, {
      method: 'POST',
      headers: getHeaders(temporaryToken),
      body: JSON.stringify({
        from: TABLES.ANSWERS,
        select: [FIELDS.ANSWERS.ANSWER, FIELDS.ANSWERS.QUESTION_ID],
        where: `{${FIELDS.ANSWERS.REQUEST_ID}.EX.'${requestId}'}`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch progress');
    }

    return response.json();
  },

  // Update an existing answer
  updateAnswer: async (answerId: string, answer: string, userId: string, requestId: string) => {
    const temporaryToken = await getTemporaryToken(TABLES.ANSWERS);
    const response = await fetch(`${QB_API_URL}/records`, {
      method: 'POST',
      headers: getHeaders(temporaryToken),
      body: JSON.stringify({
        to: TABLES.ANSWERS,
        data: [{
          [FIELDS.ANSWERS.RECORD_ID]: { value: answerId },
          [FIELDS.ANSWERS.ANSWER]: { value: answer },
          [FIELDS.ANSWERS.USER_ID]: { value: userId },
          [FIELDS.ANSWERS.REQUEST_ID]: { value: requestId }
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update answer');
    }

    return response.json();
  },

  // Get file attachment
  getFileAttachment: async (recordId: number): Promise<FileAttachmentValue> => {
    const temporaryToken = await getTemporaryToken(TABLES.ATTACHMENTS);
    try {
      const response = await fetch(`${QB_API_URL}/records/${TABLES.ATTACHMENTS}/${recordId}`, {
        method: 'GET',
        headers: getHeaders(temporaryToken)
      });
      if (!response.ok) throw new Error('Failed to fetch file attachment');
      return await response.json();
    } catch (error) {
      console.error('Error fetching file attachment:', error);
      throw error;
    }
  },

  // Get attachments for an answer
  getAttachmentsForAnswer: async (answerId: number): Promise<{ data: Attachment[] }> => {
    const temporaryToken = await getTemporaryToken(TABLES.ATTACHMENTS);
    try {
      const response = await fetch(`${QB_API_URL}/records/query`, {
        method: 'POST',
        headers: getHeaders(temporaryToken),
        body: JSON.stringify({
          from: TABLES.ATTACHMENTS,
          select: [FIELDS.ATTACHMENTS.RECORD_ID, FIELDS.ATTACHMENTS.FILE_ATTACHMENT, 8],
          where: `{${FIELDS.ATTACHMENTS.ANSWER_ID}.EX.'${answerId}'}`
        })
      });

      if (!response.ok) throw new Error('Failed to fetch attachments');
      return await response.json();
    } catch (error) {
      console.error('Error fetching attachments:', error);
      throw error;
    }
  },

  // Upload or update file attachment
  uploadFileAttachment: async (answerId: number, fileName: string, fileContent: string | File, recordId?: number): Promise<void> => {
    const temporaryToken = await getTemporaryToken(TABLES.ATTACHMENTS);
    try {
      // Convert file content to Base64 if it's a File object
      let base64Content: string;
      if (fileContent instanceof File) {
        const buffer = await fileContent.arrayBuffer();
        base64Content = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      } else {
        base64Content = fileContent; // Assume it's already Base64 encoded if it's a string
      }

      const data = {
        to: TABLES.ATTACHMENTS,
        data: [{
          ...(recordId && { [FIELDS.ATTACHMENTS.RECORD_ID]: { value: recordId } }),
          [FIELDS.ATTACHMENTS.FILE_ATTACHMENT]: {
            value: {
              fileName,
              data: base64Content
            }
          },
          [FIELDS.ATTACHMENTS.ANSWER_ID]: { value: answerId }
        }]
      };

      const response = await fetch(`${QB_API_URL}/records`, {
        method: 'POST',
        headers: getHeaders(temporaryToken),
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to upload file attachment');
    } catch (error) {
      console.error('Error uploading file attachment:', error);
      throw error;
    }
  },

  // Download file attachment
  downloadFileAttachment: async (url: string): Promise<{ fileName: string; content: string }> => {
    const temporaryToken = await getTemporaryToken(TABLES.ATTACHMENTS);
    try {
      const response = await fetch(`${QB_API_URL}${url}`, {
        method: 'GET',
        headers: getHeaders(temporaryToken)
      });

      if (!response.ok) throw new Error('Failed to download file attachment');

      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'downloaded_file';

      const content = await response.text(); // Base64 encoded content
      return { fileName, content };
    } catch (error) {
      console.error('Error downloading file attachment:', error);
      throw error;
    }
  },

  // Delete an attachment
  deleteAttachment: async (recordId: number) => {
    const temporaryToken = await getTemporaryToken(TABLES.ATTACHMENTS);
    const response = await fetch(`${QB_API_URL}/records`, {
      method: 'DELETE',
      headers: getHeaders(temporaryToken),
      body: JSON.stringify({
        from: TABLES.ATTACHMENTS,
        where: `{${FIELDS.ATTACHMENTS.RECORD_ID}.EX.'${recordId}'}`
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete attachment');
    }

    return response.json();
  },

  createWorkRequest: async (subject: string, priority: string) => {
    const temporaryToken = await getTemporaryToken('buzzytkvk');
    const response = await fetch(`${QB_API_URL}/records`, {
      method: 'POST',
      headers: getHeaders(temporaryToken),
      body: JSON.stringify({
        to: 'buzzytkvk',
        data: [
          {
            '6': { value: subject },
            '36': { value: priority }
          }
        ],
        fieldsToReturn: [3, 32, 4]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create work request');
    }

    return response.json();
  }
};
