import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('.well-known')
export class SecurityController {
  @Get('security.txt')
  getSecurityTxt(@Res() res: Response) {
    res.type('text/plain').send(
      `Contact: security@yourdomain.com
Policy: https://yourdomain.com/security-policy
Acknowledgments: https://yourdomain.com/security-acknowledgments`
    );
  }
}
