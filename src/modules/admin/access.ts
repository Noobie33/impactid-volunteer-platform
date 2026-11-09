import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { isUUID } from "class-validator";
import { EntityManager } from "typeorm";
import { Role } from "@/common/enums/role.enum";
import { UserEntity } from "@/modules/user/entities/user.entity";

export const ActorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const id: unknown = ctx
      .switchToHttp()
      .getRequest<{ user?: { id?: string } }>().user?.id;
    if (typeof id !== "string" || !isUUID(id))
      throw new UnauthorizedException("Invalid authenticated identity");
    return id;
  },
);

export async function activeActor(
  manager: EntityManager,
  id: string,
  required?: Role,
) {
  if (!id || !isUUID(id))
    throw new UnauthorizedException("Invalid authenticated identity");
  const actor = await manager.findOneBy(UserEntity, { id });
  if (!actor) throw new UnauthorizedException("Unknown account");
  if (actor.status !== "ACTIVE" || (required && actor.role !== required))
    throw new ForbiddenException("Account cannot perform this action");
  return actor;
}
