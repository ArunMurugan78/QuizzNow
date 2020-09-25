import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from 'src/user/user.module';
import { UserService } from 'src/user/user.service';
import {JWT_SECRET,JWT_EXPIRES_IN} from 'config/env';
import { JwtStrategy } from './Jwt.strategy';
import { AuthService } from './auth.service';

@Module({
    imports:[PassportModule.register({
        defaultStrategy:'jwt',
        session:false,
    }),UserModule,JwtModule.register({
        secret:JWT_SECRET,
        signOptions:{
            expiresIn:JWT_EXPIRES_IN,
        }
    })]
    ,
    providers:[UserService,JwtStrategy, AuthService],
    exports:[JwtStrategy,AuthService]
})
export class AuthModule {}
