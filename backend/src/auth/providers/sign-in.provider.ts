/* eslint-disable prettier/prettier */
import { forwardRef, Inject, Injectable, RequestTimeoutException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { UsersService } from '../../users/providers/users.service';
import { HashingProvider } from './hashing.provider';
import jwtConfig from '../authConfig/jwt.config';
import { LoginDto } from '../dtos/login.dto';

@Injectable()
export class SignInProvider {
    constructor(
        // injecting userService repo
        @Inject(forwardRef(() => UsersService))
        private readonly userService: UsersService,

        // injecting hashing dependency
        private readonly hashingProvider: HashingProvider,

        // inject jwt service
        private readonly jwtService: JwtService, 

        // inject jwt
        @Inject(jwtConfig.KEY)
        private readonly jwtConfiguration: ConfigType<typeof jwtConfig>
    ){}
    public async SignIn(signInDto: LoginDto) {
        // check if user exist in db
        // throw error if user doesnt exist
        let user = await this.userService.GetOneByEmail(signInDto.email)

        // conpare password
        let isCheckedPassword: boolean = false

        try {
            isCheckedPassword = await this.hashingProvider.comparePasswords(signInDto.password, (await user).password)
        } catch (error) {
            throw new RequestTimeoutException(error, {
                description: 'error  connecting to the database'
            })
        }

        if (!isCheckedPassword) {
            throw new UnauthorizedException('email or password is incorrect')
        }
 
        const accssToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email
        }, {
            audience: this.jwtConfiguration.audience,
            issuer: this.jwtConfiguration.issuer,
            expiresIn: this.jwtConfiguration.ttl
        })

        // login
        return { accssToken }
    }
}