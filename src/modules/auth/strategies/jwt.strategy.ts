import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../../user/user.repository';
import { type User } from '../../user/user.schema';

export interface JwtPayload {
  sub: string;
  email: string;
  iat?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findById(payload.sub);
    if (!user) throw new UnauthorizedException();

    if (user.passwordChangedAt) {
      const tokenIssuedAt = new Date((payload.iat ?? 0) * 1000);
      if (user.passwordChangedAt > tokenIssuedAt) {
        throw new UnauthorizedException('Password changed, please login again');
      }
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email before continuing');
    }

    return user;
  }
}
