import { Controller } from "@nestjs/common";
import { AdminService } from "@/modules/admin/admin.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}
}
