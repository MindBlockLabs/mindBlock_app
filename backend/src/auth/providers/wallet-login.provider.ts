import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ec, hash } from 'starknet';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/providers/users.service';
import jwtConfig from '../authConfig/jwt.config';
import { WalletLoginDto } from '../dtos/walletLogin.dto';

@Injectable()
export class WalletLoginProvider {
  constructor(
    // injecting userService repo
    private readonly userService: UsersService,

    // inject jwt service
    private readonly jwtService: JwtService,

    // inject jwt
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  public async WalletLogin(dto: WalletLoginDto) {
    try {
      const msg = hash.starknetKeccak(dto.walletAddress).toString(16);

      const isValid = ec.starkCurve.verify(
        dto.signature,
        msg,
        dto.walletAddress,
      );

      if (isValid === false) {
        throw new UnauthorizedException('signature is incorrect');
      }
    } catch (err) {
      throw new UnauthorizedException('signature is incorrect');
    }
    // check if user exist in db
    // throw error if user doesnt exist
    const user = await this.userService.getOneByWallet(dto.walletAddress);

    const accssToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        walletAddress: user.starknetWallet,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        expiresIn: this.jwtConfiguration.ttl,
      },
    );

    // login
    return { accssToken };
  }
}
