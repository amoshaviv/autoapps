import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";

export interface IAppMessageInstance extends Model {
  id: string;
  appId: string;
  userId: string | null;
  role: "user" | "assistant";
  content: string;
  versionId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppMessageModel extends ModelStatic<IAppMessageInstance> {
  associate(models: IModels): void;
}

export default function defineAppMessageModel(sequelize: Sequelize): IAppMessageModel {
  const AppMessage = sequelize.define("AppMessage", {
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
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { isIn: [["user", "assistant"]] },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    versionId: {
      type: DataTypes.UUID,
    },
  }) as IAppMessageModel;

  AppMessage.associate = function associate(models) {
    this.belongsTo(models.App, { as: "app", foreignKey: "appId", onDelete: "CASCADE" });
    this.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    this.belongsTo(models.AppVersion, { as: "version", foreignKey: "versionId", onDelete: "SET NULL" });
  };

  return AppMessage;
}
