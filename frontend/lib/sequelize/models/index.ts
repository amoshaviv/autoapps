import { Sequelize } from "sequelize";
import defineUserModel, { IUserModel } from "./user";
import defineOrganizationModel, { IOrganizationModel } from "./organization";
import defineUsersOrganizationsModel, {
  IUsersOrganizationsModel,
} from "./users-organizations";
import defineResetPasswordTokenModel from "./reset-password-token";
import defineInviteModel, { IInviteModel } from "./invite";

export interface IModels {
  User: IUserModel;
  Organization: IOrganizationModel;
  UsersOrganizations: IUsersOrganizationsModel;
  Invite: IInviteModel;
  ResetPasswordToken: ReturnType<typeof defineResetPasswordTokenModel>;
}

export default function defineModels(sequelizeConnection: Sequelize): IModels {
  const User = defineUserModel(sequelizeConnection);
  const Organization = defineOrganizationModel(sequelizeConnection);
  const UsersOrganizations = defineUsersOrganizationsModel(sequelizeConnection);
  const Invite = defineInviteModel(sequelizeConnection);
  const ResetPasswordToken = defineResetPasswordTokenModel(sequelizeConnection);

  return {
    User,
    Organization,
    UsersOrganizations,
    Invite,
    ResetPasswordToken,
  };
}
