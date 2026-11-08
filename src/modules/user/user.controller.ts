import { Controller } from "@nestjs/common";
import { UserService } from "@/modules/user/user.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}
}
