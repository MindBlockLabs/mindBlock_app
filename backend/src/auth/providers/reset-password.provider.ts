import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/user.entity';

@Injectable()
export class ResetPasswordProvider {
  private readonly logger = new Logger(ResetPasswordProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async resetPassword(
    token: string,
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string; success: boolean }> {
    const { password } = resetPasswordDto;

    try {
      // Validate token format
      if (!token || token.length !== 64) {
        this.logger.warn('Invalid token format received');
        throw new BadRequestException('Invalid password reset token format');
      }

      // Hash the token from URL to match stored token
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token
      const user = await this.userRepository.findOne({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: MoreThan(new Date()),
        },
      });

      if (!user) {
        this.logger.warn(
          `Invalid or expired token attempted: ${token.substring(0, 10)}...`,
        );
        throw new BadRequestException(
          'Password reset token is invalid or has expired. Please request a new password reset link.',
        );
      }

      this.logger.log(`Valid reset token found for user: ${user.id}`);

      // Hash new password
      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Update user password and clear reset token
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await this.userRepository.save(user);

        this.logger.log(`Password successfully reset for user: ${user.id}`);
      } catch (dbError) {
        this.logger.error(
          `Failed to update password for user ${user.id}:`,
          dbError,
        );
        throw new InternalServerErrorException(
          'Failed to reset password. Please try again later.',
        );
      }

      return {
        message:
          'Password has been reset successfully. You can now sign in with your new password.',
        success: true,
      };
    } catch (error) {
      // If it's already a NestJS HTTP exception, rethrow it
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error('Unexpected error in resetPassword:', error);
      throw new InternalServerErrorException(
        'An unexpected error occurred while resetting password. Please try again later.',
      );
    }
  }
}
