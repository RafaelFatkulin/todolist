import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import z, { ZodType } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodType) { }

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: z.treeifyError(result.error).errors,
      });
    }

    return result.data;
  }
}
