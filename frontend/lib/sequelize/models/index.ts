import { Sequelize } from "sequelize";
import defineUserModel, { IUserModel } from "./user";
import defineOrganizationModel, { IOrganizationModel } from "./organization";
import defineUsersOrganizationsModel, {
  IUsersOrganizationsModel,
} from "./users-organizations";
import defineResetPasswordTokenModel from "./reset-password-token";
import defineInviteModel, { IInviteModel } from "./invite";
import defineConnectionModel, { IConnectionModel } from "./connection";
import defineAppModel, { IAppModel } from "./app";
import defineAppVersionModel, { IAppVersionModel } from "./app-version";
import defineAppMessageModel, { IAppMessageModel } from "./app-message";
import defineAppActivityModel, { IAppActivityModel } from "./app-activity";

export interface IModels {
  User: IUserModel;
  Organization: IOrganizationModel;
  UsersOrganizations: IUsersOrganizationsModel;
  Invite: IInviteModel;
  ResetPasswordToken: ReturnType<typeof defineResetPasswordTokenModel>;
  Connection: IConnectionModel;
  App: IAppModel;
  AppVersion: IAppVersionModel;
  AppMessage: IAppMessageModel;
  AppActivity: IAppActivityModel;
}

export default function defineModels(sequelizeConnection: Sequelize): IModels {
  const User = defineUserModel(sequelizeConnection);
  const Organization = defineOrganizationModel(sequelizeConnection);
  const UsersOrganizations = defineUsersOrganizationsModel(sequelizeConnection);
  const Invite = defineInviteModel(sequelizeConnection);
  const ResetPasswordToken = defineResetPasswordTokenModel(sequelizeConnection);
  const Connection = defineConnectionModel(sequelizeConnection);
  const App = defineAppModel(sequelizeConnection);
  const AppVersion = defineAppVersionModel(sequelizeConnection);
  const AppMessage = defineAppMessageModel(sequelizeConnection);
  const AppActivity = defineAppActivityModel(sequelizeConnection);

  return {
    User,
    Organization,
    UsersOrganizations,
    Invite,
    ResetPasswordToken,
    Connection,
    App,
    AppVersion,
    AppMessage,
    AppActivity,
  };
}
