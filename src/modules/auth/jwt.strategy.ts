import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { UserService } from "../user/user.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_BEARER_SECRET ||
        process.env.JWT_SECRET ||
        "mySecretKey",
    });
  }

  async validate(payload: {
    user_id: string;
    name?: string;
    email: string;
    role: string;
  }) {
    const user = await this.userService.findOneById(payload.user_id);
    if (!user || user.status === "SUSPENDED") {
      throw new UnauthorizedException("User is invalid or suspended");
    }
    return {
      id: user.id,
      user_id: user.id,
      name: user.profile?.displayName,
      email: user.email,
      role: user.role,
    };
  }
}