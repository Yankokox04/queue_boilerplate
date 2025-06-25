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

## Usage Guide: A Happy Path User Story

This section walks you through a typical use case of the Email Queue Service, from queuing an email job to understanding its asynchronous processing.

### Scenario: Sending a Marketing Campaign

Imagine you are a Marketing Manager who needs to send a personalized email campaign to a list of artists and applicants. You have their unique IDs and the content of your email.

#### Step 1: Ensure Prerequisites and Start the Service

Before you begin, make sure you have:
- Your AWS environment configured (SQS queue, Lambda, DynamoDB deployed via CloudFormation).
- Your `.env` file populated with `SQS_QUEUE_URL`, `AWS_REGION`, `EMAIL_FROM_ADDRESS`, etc.

Once your environment is ready, start the local API server:

```bash
npm run dev
```

You should see output indicating the service is running on `http://localhost:3000`.

#### Step 2: Queue an Email Job

Now, you'll send a `POST` request to the `/api/email/queue` endpoint. This request will contain the IDs of your recipients and the email content. The service will immediately accept this request and place a message on the SQS queue.

Let's use `curl` to simulate this:

```bash
curl -X POST \
  http://localhost:3000/api/email/queue \
  -H "Content-Type: application/json" \
  -d '{
    "artistIds": ["a1b2c3d4-e5f6-7890-1234-567890abcdef", "f0e9d8c7-b6a5-4321-fedc-ba9876543210"],
    "applicationIds": ["11223344-5566-7788-9900-aabbccddeeff"],
    "emailContent": {
      "subject": "Exciting Opportunity for {{name}}!",
      "htmlBody": "<p>Dear {{name}},</p><p>We have an exciting opportunity for you as an {{type}}! Your email is {{email}}.</p><p>Best regards,<br>The Team</p>",
      "textBody": "Dear {{name}},\n\nWe have an exciting opportunity for you as an {{type}}! Your email is {{email}}.\n\nBest regards,\nThe Team"
    },
    "metadata": {
      "campaignId": "summer-promo-2025",
      "priority": "high"
    }
  }'
```

**Expected Response (Immediate):**

The API will respond immediately with a `200 OK` status, confirming that your email job has been successfully queued.

```json
{
  "success": true,
  "message": "Email job queued successfully",
  "data": {
    "jobId": "your-generated-job-id-here",
    "messageId": "your-sqs-message-id-here",
    "estimatedRecipients": 3,
    "queuedAt": "2025-06-25T14:30:00.000Z"
  }
}
```

Note the `jobId` and `messageId` in the response. The `jobId` is a unique identifier for your entire email campaign, and the `messageId` is the ID of the message placed on the SQS queue.

#### Step 3: Asynchronous Processing (Behind the Scenes)

After the API queues the message, the following happens asynchronously:

1. **SQS Queue**: The message containing your email job details sits in the SQS queue.
2. **Lambda Trigger**: Your AWS Lambda function (e.g., `email-processor-dev`) is triggered by the SQS message.
3. **Lambda Execution**: The Lambda function:
   - Updates the job status in DynamoDB to `processing`.
   - Looks up the actual email addresses for the provided `artistIds` and `applicationIds` (using placeholder logic in `lambda/index.js`).
   - Personalizes the email content for each recipient.
   - Sends emails via AWS SES (or logs them in development mode).
   - Updates the job status in DynamoDB to `completed` or `failed` based on the outcome.

You can observe the Lambda's activity in your AWS CloudWatch logs for the `email-processor` function.

#### Step 4: Check Job Status (Placeholder)

While the Lambda processes the emails, you can check the status of your job using the `jobId` returned in Step 2.

```bash
curl http://localhost:3000/api/email/status/your-generated-job-id-here
```

**Expected Response (Placeholder):**

Currently, this endpoint returns a placeholder status. In a full implementation, it would query DynamoDB for the actual status updated by the Lambda.

```json
{
  "success": true,
  "data": {
    "jobId": "your-generated-job-id-here",
    "status": "queued",
    "message": "Job status tracking not yet implemented"
  }
}
```

This happy path demonstrates how you can initiate a bulk email campaign and receive immediate confirmation, with the heavy lifting of email sending handled asynchronously by the AWS backend.

#### Step 5: Monitor and Debug

- **Check Health**: Visit `http://localhost:3000/api/health/detailed` to see service status
- **View Logs**: Check `logs/combined.log` for application logs
- **AWS CloudWatch**: Monitor Lambda execution logs in AWS Console
- **SQS Console**: View queue metrics and message processing in AWS Console

---

## Guía de Uso: Una Historia de Usuario de "Camino Feliz"

Esta sección le guiará a través de un caso de uso típico del Servicio de Cola de Correo Electrónico, desde la puesta en cola de un trabajo de correo electrónico hasta la comprensión de su procesamiento asíncrono.

### Escenario: Envío de una Campaña de Marketing

Imagine que usted es un Gerente de Marketing que necesita enviar una campaña de correo electrónico personalizada a una lista de artistas y solicitantes. Usted tiene sus IDs únicos y el contenido de su correo electrónico.

#### Paso 1: Asegurar los Prerrequisitos e Iniciar el Servicio

Antes de comenzar, asegúrese de tener:
- Su entorno de AWS configurado (cola SQS, Lambda, DynamoDB desplegados a través de CloudFormation).
- Su archivo `.env` completado con `SQS_QUEUE_URL`, `AWS_REGION`, `EMAIL_FROM_ADDRESS`, etc.

Una vez que su entorno esté listo, inicie el servidor API local:

```bash
npm run dev
```

Debería ver una salida que indica que el servicio se está ejecutando en `http://localhost:3000`.

#### Paso 2: Poner en Cola un Trabajo de Correo Electrónico

Ahora, enviará una solicitud `POST` al endpoint `/api/email/queue`. Esta solicitud contendrá los IDs de sus destinatarios y el contenido del correo electrónico. El servicio aceptará inmediatamente esta solicitud y colocará un mensaje en la cola SQS.

Usemos `curl` para simular esto:

```bash
curl -X POST \
  http://localhost:3000/api/email/queue \
  -H "Content-Type: application/json" \
  -d '{
    "artistIds": ["a1b2c3d4-e5f6-7890-1234-567890abcdef", "f0e9d8c7-b6a5-4321-fedc-ba9876543210"],
    "applicationIds": ["11223344-5566-7788-9900-aabbccddeeff"],
    "emailContent": {
      "subject": "Oportunidad Emocionante para {{name}}!",
      "htmlBody": "<p>Estimado/a {{name}},</p><p>¡Tenemos una oportunidad emocionante para usted como {{type}}! Su correo electrónico es {{email}}.</p><p>Saludos cordiales,<br>El Equipo</p>",
      "textBody": "Estimado/a {{name}},\n\n¡Tenemos una oportunidad emocionante para usted como {{type}}! Su correo electrónico es {{email}}.\n\nSaludos cordiales,\nEl Equipo"
    },
    "metadata": {
      "campaignId": "promo-verano-2025",
      "priority": "high"
    }
  }'
```

**Respuesta Esperada (Inmediata):**

La API responderá inmediatamente con un estado `200 OK`, confirmando que su trabajo de correo electrónico ha sido puesto en cola con éxito.

```json
{
  "success": true,
  "message": "Email job queued successfully",
  "data": {
    "jobId": "su-job-id-generado-aqui",
    "messageId": "su-sqs-message-id-aqui",
    "estimatedRecipients": 3,
    "queuedAt": "2025-06-25T14:30:00.000Z"
  }
}
```

Observe el `jobId` y `messageId` en la respuesta. El `jobId` es un identificador único para toda su campaña de correo electrónico, y el `messageId` es el ID del mensaje colocado en la cola SQS.

#### Paso 3: Procesamiento Asíncrono (Detrás de Escena)

Después de que la API pone en cola el mensaje, ocurre lo siguiente de forma asíncrona:

1. **Cola SQS**: El mensaje que contiene los detalles de su trabajo de correo electrónico permanece en la cola SQS.
2. **Activador Lambda**: Su función AWS Lambda (por ejemplo, `email-processor-dev`) se activa mediante el mensaje de SQS.
3. **Ejecución Lambda**: La función Lambda:
   - Actualiza el estado del trabajo en DynamoDB a `processing`.
   - Busca las direcciones de correo electrónico reales para los `artistIds` y `applicationIds` proporcionados (utilizando lógica de marcador de posición en `lambda/index.js`).
   - Personaliza el contenido del correo electrónico para cada destinatario.
   - Envía correos electrónicos a través de AWS SES (o los registra en modo de desarrollo).
   - Actualiza el estado del trabajo en DynamoDB a `completed` o `failed` según el resultado.

Puede observar la actividad de Lambda en sus registros de AWS CloudWatch para la función `email-processor`.

#### Paso 4: Verificar el Estado del Trabajo (Marcador de Posición)

Mientras Lambda procesa los correos electrónicos, puede verificar el estado de su trabajo utilizando el `jobId` devuelto en el Paso 2.

```bash
curl http://localhost:3000/api/email/status/su-job-id-generado-aqui
```

**Respuesta Esperada (Marcador de Posición):**

Actualmente, este endpoint devuelve un estado de marcador de posición. En una implementación completa, consultaría DynamoDB para obtener el estado real actualizado por Lambda.

```json
{
  "success": true,
  "data": {
    "jobId": "su-job-id-generado-aqui",
    "status": "queued",
    "message": "Job status tracking not yet implemented"
  }
}
```

Este "camino feliz" demuestra cómo puede iniciar una campaña de correo electrónico masiva y recibir una confirmación inmediata, con el trabajo pesado del envío de correos electrónicos manejado de forma asíncrona por el backend de AWS.

#### Paso 5: Monitorear y Depurar

- **Verificar Salud**: Visite `http://localhost:3000/api/health/detailed` para ver el estado del servicio
- **Ver Registros**: Revise `logs/combined.log` para los registros de la aplicación
- **AWS CloudWatch**: Monitoree los registros de ejecución de Lambda en la Consola de AWS
- **Consola SQS**: Vea las métricas de la cola y el procesamiento de mensajes en la Consola de AWS

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