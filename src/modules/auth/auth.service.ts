import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from '../user/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../../infrastructure/mail/mail.service';
import { LoginInput, RegisterInput, TokensDto } from './auth.dto';
import { hash } from 'bcryptjs';
import { User } from '../user/user.schema';
import { JwtPayload } from './strategies/jwt.strategy';
import type { StringValue } from 'ms';
import { compare } from 'bcryptjs';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly mailService: MailService,
  ) { }

  async register(dto: RegisterInput): Promise<TokensDto> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await hash(dto.password, 12);
    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    this.logger.log(`User ${user.id} registered`);

    this.mailService
      .sendWelcome({
        to: user.email,
        name: user.name ?? user.email,
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.stack : String(err);
        this.logger.error(`Failed to queue welcome email for ${user.email}`, message);
      });

    return this.issueTokens(user);
  }

  async login(dto: LoginInput): Promise<TokensDto> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await compare(dto.password, user.passwordHash);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async refresh(userId: string, refreshToken: string): Promise<TokensDto> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.refreshToken) throw new UnauthorizedException();

    const isValid = await compare(refreshToken, user.refreshToken);
    if (!isValid) throw new UnauthorizedException();

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: null });
  }

  private async issueTokens(user: User): Promise<TokensDto> {
    const payload: JwtPayload = { sub: user.id, email: user.email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m') as StringValue,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as StringValue,
      }),
    ]);

    const refreshTokenHash = await hash(refreshToken, 10);
    await this.userRepository.update(user.id, { refreshToken: refreshTokenHash });

    return { accessToken, refreshToken };
  }
}
