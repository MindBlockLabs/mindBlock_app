import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import jwtConfig from '../authConfig/jwt.config';
import { REQUEST_USER_KEY } from '../constants/auth.constant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {
    // Validate secret exists
    if (!jwtConfiguration.secret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfiguration.secret,
      audience: jwtConfiguration.audience,
      issuer: jwtConfiguration.issuer,
    });
  }

  async validate(payload: any) {
    // This is what gets attached to request[REQUEST_USER_KEY] or request.user
    console.log('JWT Strategy validate payload:', payload);

    return {
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  }
}
