import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import * as crypto from 'crypto';
import { User } from 'src/users/user.entity';
import { MailService } from './mail.service';

@Injectable()
export class ForgotPasswordProvider {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  public async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });

    // For security reasons, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user || !user.email) {
      // ✅ Added !user.email check
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set token expiration (1 hour from now)
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Save hashed token and expiry to user
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = resetTokenExpiry;
    await this.userRepository.save(user);

    // Send reset email
    try {
      await this.mailService.sendPasswordResetEmail(
        user.email, //
        user.username || user.email.split('@')[0],
        resetToken,
      );
    } catch (error) {
      // Log error but don't expose to user
      console.error('Failed to send password reset email:', error);
    }

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }
}
