# Email Queue Service

A Node.js/AWS-based email queue service for processing bulk emails asynchronously using SQS and Lambda.

## Architecture

```
API Server (Express.js) → SQS Queue → Lambda Processor → Email Service (SES)
                                   ↓
                              DynamoDB (Job Status)
```

## Features

- **RESTful API** for queuing email jobs
- **AWS SQS** for reliable message queuing
- **AWS Lambda** for serverless email processing
- **Input validation** with Joi
- **Rate limiting** and security middleware
- **Comprehensive logging** with Winston
- **Health checks** for monitoring
- **Error handling** and retry logic
- **Job status tracking** (placeholder implementation)

## Quick Start

### Prerequisites

- Node.js 18+
- AWS Account with appropriate permissions
- AWS CLI configured

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd email-queue-service
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your AWS credentials and configuration
```

4. Deploy AWS infrastructure:
```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation.yaml \
  --stack-name email-queue-service-dev \
  --parameter-overrides Environment=dev \
  --capabilities CAPABILITY_NAMED_IAM
```

5. Deploy Lambda function:
```bash
cd lambda
npm install
cd ..
npm run deploy:lambda
```

6. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Queue Email Job
```http
POST /api/email/queue
Content-Type: application/json

{
  "artistIds": ["uuid1", "uuid2"],
  "applicationIds": ["uuid3", "uuid4"],
  "emailContent": {
    "subject": "Hello {{name}}",
    "htmlBody": "<h1>Hello {{name}}</h1><p>This is a test email.</p>",
    "textBody": "Hello {{name}}\n\nThis is a test email."
  },
  "metadata": {
    "campaignId": "campaign-123",
    "priority": "normal"
  }
}
```

### Get Job Status
```http
GET /api/email/status/{jobId}
```

### Health Checks
```http
GET /api/health
GET /api/health/detailed
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `AWS_REGION` | AWS region | `us-east-1` |
| `SQS_QUEUE_URL` | SQS queue URL | Required |
| `SQS_DLQ_URL` | Dead letter queue URL | Required |
| `EMAIL_FROM_ADDRESS` | From email address | Required |
| `LOG_LEVEL` | Logging level | `info` |

## AWS Infrastructure

The CloudFormation template creates:

- **SQS Queue** for email processing
- **Dead Letter Queue** for failed messages
- **Lambda Function** for email processing
- **DynamoDB Table** for job status tracking
- **IAM Roles and Policies** with least privilege
- **CloudWatch Log Groups** for monitoring

## Development

### Running Tests
```bash
npm test
npm run test:watch
```

### Linting
```bash
npm run lint
npm run lint:fix
```

### Local Development
```bash
npm run dev
```

## Deployment

### Deploy Infrastructure
```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation.yaml \
  --stack-name email-queue-service-prod \
  --parameter-overrides Environment=prod \
  --capabilities CAPABILITY_NAMED_IAM
```

### Deploy Lambda Function
```bash
npm run deploy:lambda
```

## Monitoring

- **CloudWatch Logs**: Lambda execution logs
- **SQS Metrics**: Queue depth, message age
- **Health Endpoints**: Service status monitoring
- **Error Tracking**: Comprehensive error logging

## Security

- **Rate limiting** on API endpoints
- **Input validation** with Joi schemas
- **Helmet.js** for security headers
- **IAM roles** with least privilege
- **Environment variable** protection

## TODO / Business Logic Placeholders

The following areas need implementation based on your specific requirements:

1. **Recipient Lookup Logic** (`lambda/index.js`):
   - Implement database queries to fetch email addresses from artist/application IDs
   - Add caching for frequently accessed data

2. **Email Service Integration**:
   - Configure AWS SES or integrate with third-party email service
   - Implement email templates and personalization

3. **Job Status Tracking**:
   - Complete DynamoDB integration for job status updates
   - Add API endpoints for detailed job monitoring

4. **Authentication & Authorization**:
   - Add API key authentication
   - Implement role-based access control

5. **Advanced Features**:
   - Email scheduling
   - Template management
   - Bounce/complaint handling
   - Analytics and reporting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## License

MIT License - see LICENSE file for details.