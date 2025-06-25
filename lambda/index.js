const AWS = require('aws-sdk');

// Configure AWS services
const ses = new AWS.SES({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

// Lambda handler for processing email queue messages
exports.handler = async (event) => {
  console.log('Processing SQS messages:', JSON.stringify(event, null, 2));

  const results = [];

  for (const record of event.Records) {
    try {
      const messageBody = JSON.parse(record.body);
      const result = await processEmailJob(messageBody);
      results.push({ messageId: record.messageId, status: 'success', result });
    } catch (error) {
      console.error('Failed to process message:', {
        messageId: record.messageId,
        error: error.message,
        stack: error.stack
      });
      
      results.push({ 
        messageId: record.messageId, 
        status: 'error', 
        error: error.message 
      });
      
      // Don't throw here - let SQS handle retries and DLQ
    }
  }

  console.log('Processing complete:', results);
  return results;
};

async function processEmailJob(jobData) {
  const { jobId, artistIds, applicationIds, emailContent, metadata } = jobData;
  
  console.log('Processing email job:', {
    jobId,
    artistCount: artistIds?.length || 0,
    applicationCount: applicationIds?.length || 0
  });

  // Update job status to processing
  await updateJobStatus(jobId, 'processing', {
    startedAt: new Date().toISOString(),
    totalRecipients: (artistIds?.length || 0) + (applicationIds?.length || 0)
  });

  try {
    // TODO: Implement actual recipient lookup logic
    const recipients = await getRecipients(artistIds, applicationIds);
    
    // TODO: Implement actual email sending logic
    const emailResults = await sendEmails(recipients, emailContent, metadata);
    
    // Update job status to completed
    await updateJobStatus(jobId, 'completed', {
      completedAt: new Date().toISOString(),
      emailsSent: emailResults.successful?.length || 0,
      emailsFailed: emailResults.failed?.length || 0,
      results: emailResults
    });

    return {
      jobId,
      status: 'completed',
      emailsSent: emailResults.successful?.length || 0,
      emailsFailed: emailResults.failed?.length || 0
    };

  } catch (error) {
    // Update job status to failed
    await updateJobStatus(jobId, 'failed', {
      failedAt: new Date().toISOString(),
      error: error.message
    });
    
    throw error;
  }
}

async function getRecipients(artistIds = [], applicationIds = []) {
  // TODO: Implement actual database queries to get recipient email addresses
  // This is a placeholder implementation
  
  const recipients = [];
  
  // Mock artist email lookup
  for (const artistId of artistIds) {
    // In real implementation, query your database for artist email
    recipients.push({
      id: artistId,
      type: 'artist',
      email: `artist-${artistId}@example.com`, // placeholder
      name: `Artist ${artistId}` // placeholder
    });
  }
  
  // Mock application email lookup
  for (const applicationId of applicationIds) {
    // In real implementation, query your database for application contact email
    recipients.push({
      id: applicationId,
      type: 'application',
      email: `applicant-${applicationId}@example.com`, // placeholder
      name: `Applicant ${applicationId}` // placeholder
    });
  }
  
  console.log(`Found ${recipients.length} recipients`);
  return recipients;
}

async function sendEmails(recipients, emailContent, metadata) {
  const results = {
    successful: [],
    failed: []
  };

  // TODO: Implement actual email sending logic
  // This is a placeholder implementation using AWS SES
  
  for (const recipient of recipients) {
    try {
      // Personalize email content if needed
      const personalizedContent = personalizeEmailContent(emailContent, recipient);
      
      const emailParams = {
        Source: process.env.EMAIL_FROM_ADDRESS || 'noreply@yourcompany.com',
        Destination: {
          ToAddresses: [recipient.email]
        },
        Message: {
          Subject: {
            Data: personalizedContent.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: personalizedContent.htmlBody,
              Charset: 'UTF-8'
            },
            ...(personalizedContent.textBody && {
              Text: {
                Data: personalizedContent.textBody,
                Charset: 'UTF-8'
              }
            })
          }
        },
        Tags: [
          {
            Name: 'JobId',
            Value: metadata?.jobId || 'unknown'
          },
          {
            Name: 'RecipientType',
            Value: recipient.type
          }
        ]
      };

      // In development/testing, just log instead of actually sending
      if (process.env.NODE_ENV === 'development') {
        console.log('Would send email:', {
          to: recipient.email,
          subject: personalizedContent.subject,
          recipientType: recipient.type
        });
        
        results.successful.push({
          recipientId: recipient.id,
          email: recipient.email,
          messageId: `mock-${Date.now()}-${Math.random()}`
        });
      } else {
        // Actually send email in production
        const result = await ses.sendEmail(emailParams).promise();
        
        results.successful.push({
          recipientId: recipient.id,
          email: recipient.email,
          messageId: result.MessageId
        });
      }

    } catch (error) {
      console.error('Failed to send email:', {
        recipientId: recipient.id,
        email: recipient.email,
        error: error.message
      });
      
      results.failed.push({
        recipientId: recipient.id,
        email: recipient.email,
        error: error.message
      });
    }
  }

  console.log('Email sending complete:', {
    successful: results.successful.length,
    failed: results.failed.length
  });

  return results;
}

function personalizeEmailContent(emailContent, recipient) {
  // TODO: Implement email personalization logic
  // This is a basic placeholder implementation
  
  let personalizedSubject = emailContent.subject;
  let personalizedHtmlBody = emailContent.htmlBody;
  let personalizedTextBody = emailContent.textBody;

  // Simple placeholder replacement
  const replacements = {
    '{{name}}': recipient.name || 'there',
    '{{email}}': recipient.email,
    '{{type}}': recipient.type
  };

  for (const [placeholder, value] of Object.entries(replacements)) {
    personalizedSubject = personalizedSubject?.replace(new RegExp(placeholder, 'g'), value);
    personalizedHtmlBody = personalizedHtmlBody?.replace(new RegExp(placeholder, 'g'), value);
    personalizedTextBody = personalizedTextBody?.replace(new RegExp(placeholder, 'g'), value);
  }

  return {
    subject: personalizedSubject,
    htmlBody: personalizedHtmlBody,
    textBody: personalizedTextBody
  };
}

async function updateJobStatus(jobId, status, additionalData = {}) {
  // TODO: Implement job status tracking in DynamoDB or your preferred database
  // This is a placeholder implementation
  
  try {
    const params = {
      TableName: process.env.JOB_STATUS_TABLE || 'email-job-status',
      Key: { jobId },
      UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':updatedAt': new Date().toISOString()
      }
    };

    // Add additional data to the update expression
    if (Object.keys(additionalData).length > 0) {
      const additionalUpdates = Object.keys(additionalData).map(key => `#${key} = :${key}`);
      params.UpdateExpression += ', ' + additionalUpdates.join(', ');
      
      for (const [key, value] of Object.entries(additionalData)) {
        params.ExpressionAttributeNames[`#${key}`] = key;
        params.ExpressionAttributeValues[`:${key}`] = value;
      }
    }

    // In development, just log the status update
    if (process.env.NODE_ENV === 'development') {
      console.log('Would update job status:', { jobId, status, ...additionalData });
    } else {
      await dynamodb.update(params).promise();
    }

  } catch (error) {
    console.error('Failed to update job status:', {
      jobId,
      status,
      error: error.message
    });
    // Don't throw here - status updates shouldn't fail the main process
  }
}