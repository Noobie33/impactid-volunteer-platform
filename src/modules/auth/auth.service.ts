import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { UserService } from "../user/user.service";
import { AuthDto, RegisterDto } from "./dto/auth.dto";
import { UserEntity } from "../user/entities/user.entity";
import { ProfileEntity } from "../user/entities/profile.entity";
import { appConfig } from "@/config/app.config";
import { JwtService } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt.strategy";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwt: JwtService,
  ) {
    new JwtStrategy(this.userService);
  }

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(
      dto.password,
      appConfig.recommended_bycrypt_rounds,
    );
    const user = await this.userService.createUserWithProfile({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role: dto.role,
    });

    const tokens = await this.signTokens(user);
    return {
      message: "Registration successful",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.profile?.displayName,
      },
      ...tokens,
    };
  }

  async signIn(dto: AuthDto) {
    const user = await this.checkUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException("User or Password not found");
    }
    if (user.status === "SUSPENDED") {
      throw new ForbiddenException("User account is suspended");
    }
    await this.validateUser(user, dto.password);
    const { access_token, refresh_token, expires_in } =
      await this.signTokens(user);
    return { access_token, refresh_token, expires_in };
  }

  async signTokens(
    user: UserEntity & { profile?: ProfileEntity | null },
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    permissions?: any;
  }> {
    const expires_in = Date.now() + 1000 * 60 * 60 * 24 * 7;
    const accessPayload = {
      user_id: user.id,
      name: user.profile?.displayName,
      email: user.email,
      role: user.role,
    };
    const refreshPayload = {
      user_id: user.id,
    };

    const bearerSecret =
      process.env.JWT_BEARER_SECRET || process.env.JWT_SECRET || "mySecretKey";
    const refreshSecret =
      process.env.JWT_REFRESH_SECRET || "myRefreshSecretKey";

    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: bearerSecret,
      expiresIn: "15d",
    });

    const refresh_token = await this.jwt.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: "7d",
    });

    return {
      access_token: accessToken,
      refresh_token: refresh_token,
      expires_in: expires_in,
    };
  }

  async checkUserByEmail(email: string) {
    try {
      const user = await this.userService.findOneByEmail(email);
      return user;
    } catch (e: any) {
      throw new NotFoundException("User not found");
    }
  }

  async validateUser(user: UserEntity, password: string) {
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException("User or Password not found");
    }
    return true;
  }
}