import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UserRepository } from '../../user/user.repository';
import { type JwtPayload } from './jwt.strategy';

export interface JwtRefreshPayload extends JwtPayload {
  refreshToken: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly config: ConfigService,
    private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtRefreshPayload> {
    const body = req.body as Record<string, unknown>;
    const refreshToken = typeof body.refreshToken === 'string' ? body.refreshToken : undefined;

    if (!refreshToken) throw new UnauthorizedException();

    const user = await this.userRepository.findById(payload.sub);
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    return { ...payload, refreshToken };
  }
}
