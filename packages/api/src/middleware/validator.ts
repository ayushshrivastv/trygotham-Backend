import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { InvalidProofError } from '@zk-census/types';

export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return next(new InvalidProofError(message));
    }

    next();
  };
}

// Validation schemas
export const schemas = {
  createCensus: Joi.object({
    name: Joi.string().max(64).required(),
    description: Joi.string().max(256).required(),
    enableLocation: Joi.boolean().default(true),
    minAge: Joi.number().integer().min(0).max(6).optional(),
  }),

  submitProof: Joi.object({
    censusId: Joi.string().max(32).required(),
    proof: Joi.object({
      pi_a: Joi.array().items(Joi.string()).length(2).required(),
      pi_b: Joi.array()
        .items(Joi.array().items(Joi.string()).length(2))
        .length(2)
        .required(),
      pi_c: Joi.array().items(Joi.string()).length(2).required(),
      protocol: Joi.string().valid('groth16').required(),
      curve: Joi.string().valid('bn128').required(),
    }).required(),
    publicSignals: Joi.object({
      nullifierHash: Joi.string().required(),
      ageRange: Joi.number().integer().min(0).max(6).required(),
      continent: Joi.number().integer().min(0).max(6).required(),
      censusId: Joi.string().required(),
      timestamp: Joi.number().integer().required(),
    }).required(),
    signature: Joi.string().required(),
    publicKey: Joi.string().required(),
  }),
};
