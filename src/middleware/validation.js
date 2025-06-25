const Joi = require('joi');
const logger = require('../utils/logger');

const emailRequestSchema = Joi.object({
  artistIds: Joi.array().items(Joi.string().uuid()).optional(),
  applicationIds: Joi.array().items(Joi.string().uuid()).optional(),
  emailContent: Joi.object({
    subject: Joi.string().required().max(200),
    htmlBody: Joi.string().required(),
    textBody: Joi.string().optional(),
    attachments: Joi.array().items(
      Joi.object({
        filename: Joi.string().required(),
        contentType: Joi.string().required(),
        content: Joi.string().required() // base64 encoded
      })
    ).optional()
  }).required(),
  metadata: Joi.object({
    campaignId: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    priority: Joi.string().valid('low', 'normal', 'high').default('normal'),
    scheduledAt: Joi.date().iso().optional()
  }).optional()
}).custom((value, helpers) => {
  // At least one of artistIds or applicationIds must be provided
  if (!value.artistIds?.length && !value.applicationIds?.length) {
    return helpers.error('custom.missingRecipients');
  }
  return value;
}).messages({
  'custom.missingRecipients': 'At least one artistId or applicationId must be provided'
});

const validateEmailRequest = (req, res, next) => {
  const { error, value } = emailRequestSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    logger.warn('Email request validation failed', {
      errors: validationErrors,
      requestBody: req.body
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }

  // Replace request body with validated and sanitized data
  req.body = value;
  next();
};

module.exports = {
  validateEmailRequest
};