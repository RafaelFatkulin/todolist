import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { type User } from '../../modules/user/user.schema';

interface RequestWithUser {
  user: User;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
