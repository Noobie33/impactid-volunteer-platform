import { Injectable } from "@nestjs/common";
import { AuthGuard as PassportAuthGuard } from "@nestjs/passport";

/**
 * Fail-closed JWT guard. The auth module must register a Passport JWT
 * strategy before a protected route uses this guard.
 */
@Injectable()
export class AuthGuard extends PassportAuthGuard("jwt") {}
