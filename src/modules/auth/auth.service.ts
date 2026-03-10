import { ConflictException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { createHash, randomBytes } from 'crypto';

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
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      verificationToken,
      verificationTokenExpiresAt,
    });

    this.logger.log(`User ${user.id} registered`);

    const verificationUrl = `${this.config.getOrThrow<string>('APP_URL')}/auth/verify-email?token=${verificationToken}`;

    this.mailService
      .sendVerificationEmail({
        to: user.email,
        name: user.name ?? user.email,
        verificationUrl,
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
    if (!isValid) {
      await this.userRepository.update(userId, { refreshToken: null });
      this.logger.warn(`Refresh token reuse detected for user ${userId} — all sessions invalidated`);
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.userRepository.update(userId, { refreshToken: null });

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
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '7d') as StringValue,
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

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByVerificationToken(token);

    if (!user || !user.verificationTokenExpiresAt) {
      throw new NotFoundException('Invalid verification token');
    }

    if (user.verificationTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Verification token expired');
    }

    await this.userRepository.update(user.id, {
      emailVerified: new Date(),
      verificationToken: null,
      verificationTokenExpiresAt: null,
    });

    this.logger.log(`User ${user.id} verified email`);
    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) return { message: 'If this email exists, a reset link has been sent' };

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const resetPasswordTokenExpiresAt = new Date(Date.now() + 3600 * 1000);

    await this.userRepository.update(user.id, {
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpiresAt,
    });

    const resetUrl = `${this.config.getOrThrow<string>('APP_URL')}/auth/reset-password?token=${rawToken}`;

    this.mailService
      .sendResetPassword({
        to: user.email,
        name: user.name ?? user.email,
        resetUrl,
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.stack : String(err);
        this.logger.error(`Failed to queue reset password email for ${user.email}`, message);
      });

    return { message: 'If this email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const hashedToken = createHash('sha256').update(token).digest('hex');
    const user = await this.userRepository.findByResetPasswordToken(hashedToken);

    if (!user || !user.resetPasswordTokenExpiresAt) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (user.resetPasswordTokenExpiresAt < new Date()) {
      throw new UnauthorizedException('Reset token has expired');
    }

    const passwordHash = await hash(newPassword, 12);

    await this.userRepository.update(user.id, {
      passwordHash,
      resetPasswordToken: null,
      resetPasswordTokenExpiresAt: null,
      refreshToken: null,
      passwordChangedAt: new Date(),
    });

    this.logger.log(`User ${user.id} reset password`);
    return { message: 'Password reset successfully' };
  }
}
