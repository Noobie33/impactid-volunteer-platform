export enum Role {
  VOLUNTEER = "VOLUNTEER",
  ORGANIZATION = "ORGANIZATION",
  ADMINISTRATOR = "ADMINISTRATOR",
}

export const RoleHierarchy: { [key in Role]: number } = {
  [Role.VOLUNTEER]: 1,
  [Role.ORGANIZATION]: 2,
  [Role.ADMINISTRATOR]: 3,
};
