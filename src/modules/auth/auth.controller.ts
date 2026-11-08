import { Controller } from "@nestjs/common";
import { AuthService } from "@/modules/auth/auth.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}
