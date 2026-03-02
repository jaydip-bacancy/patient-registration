import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export const globalValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  exceptionFactory: (errors: ValidationError[]) => {
    const details = errors.map((error) => ({
      field: error.property,
      constraints: Object.values(error.constraints || {}),
      children: error.children?.length
        ? error.children.map((child) => ({
            field: child.property,
            constraints: Object.values(child.constraints || {}),
          }))
        : undefined,
    }));

    throw new BadRequestException({
      message: 'Validation failed',
      error: 'Bad Request',
      details,
    });
  },
});
