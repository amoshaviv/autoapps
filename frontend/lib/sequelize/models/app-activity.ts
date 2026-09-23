import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";
import { IUserInstance } from "./user";

export type ActivityChanges = Record<string, { from: string; to: string }>;

export interface IAppActivityInstance extends Model {
  id: string;
  appId: string;
  userId: string;
  action: "row_updated" | "row_appended";
  rowNumber: number;
  changes: ActivityChanges;
  createdAt: Date;
  updatedAt: Date;
  user?: IUserInstance;
}

export interface IAppActivityModel extends ModelStatic<IAppActivityInstance> {
  associate(models: IModels): void;
  record(args: {
    app: { id: string };
    user: IUserInstance;
    action: "row_updated" | "row_appended";
    rowNumber: number;
    changes: ActivityChanges;
  }): Promise<IAppActivityInstance>;
}

export default function defineAppActivityModel(sequelize: Sequelize): IAppActivityModel {
  const AppActivity = sequelize.define("AppActivity", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    appId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["row_updated", "row_appended"]] },
    },
    rowNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    changes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  }) as IAppActivityModel;

  AppActivity.associate = function associate(models) {
    this.belongsTo(models.App, { as: "app", foreignKey: "appId", onDelete: "CASCADE" });
    this.belongsTo(models.User, { as: "user", foreignKey: "userId" });
  };

  AppActivity.record = async function record({ app, user, action, rowNumber, changes }) {
    return this.create({ appId: app.id, userId: user.id, action, rowNumber, changes });
  };

  return AppActivity;
}
