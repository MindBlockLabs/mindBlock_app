import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { MailService } from './mail.service';
import * as crypto from 'crypto';
import { User } from '../../users/user.entity';

@Injectable()
export class ForgotPasswordProvider {
  private readonly logger = new Logger(ForgotPasswordProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  public async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string; success: boolean; emailSending?: string }> {
    const { email } = forgotPasswordDto;

    try {
      // Find user by email
      const user = await this.userRepository.findOne({ where: { email } });

      // Check if user exists - return explicit error
      if (!user || !user.email) {
        this.logger.warn(
          `Password reset requested for non-existent email: ${email}`,
        );
        throw new NotFoundException('The user does not exist');
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

      try {
        await this.userRepository.save(user);
        this.logger.log(`Password reset token generated for user: ${user.id}`);
      } catch (dbError) {
        this.logger.error(
          `Failed to save reset token for user ${user.id}:`,
          dbError,
        );
        throw new InternalServerErrorException(
          'Failed to process password reset request. Please try again later.',
        );
      }

      // Send reset email
      try {
        await this.mailService.sendPasswordResetEmail(
          user.email,
          user.username || user.email.split('@')[0],
          resetToken,
        );
        this.logger.log(
          `Password reset email sent successfully to: ${user.email}`,
        );
      } catch (emailError) {
        // Log error and clear the token since email failed
        this.logger.error(
          `Failed to send password reset email to ${user.email}:`,
          emailError,
        );

        // Rollback: Clear the reset token since email failed
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await this.userRepository.save(user);

        throw new InternalServerErrorException(
          'Failed to send password reset email. Please try again later.',
        );
      }

      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
        success: true,
        emailSending: 'success',
      };
    } catch (error) {
      // If it's already a NestJS HTTP exception, rethrow it
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error('Unexpected error in forgotPassword:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred. Please try again later.',
      );
    }
  }
}
