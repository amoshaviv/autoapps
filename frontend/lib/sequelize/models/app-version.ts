import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";

export interface IAppVersionInstance extends Model {
  id: string;
  appId: string;
  number: number;
  // Shape defined by the AppSpec zod schema (lib/apps/spec.ts, P2-1)
  spec: Record<string, unknown>;
  summary: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAppVersionModel extends ModelStatic<IAppVersionInstance> {
  associate(models: IModels): void;
}

export default function defineAppVersionModel(sequelize: Sequelize): IAppVersionModel {
  const AppVersion = sequelize.define(
    "AppVersion",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      appId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      spec: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      summary: {
        type: DataTypes.TEXT,
      },
      createdById: {
        type: DataTypes.UUID,
      },
    },
    {
      indexes: [{ unique: true, fields: ["app_id", "number"] }],
    }
  ) as IAppVersionModel;

  AppVersion.associate = function associate(models) {
    this.belongsTo(models.App, { as: "app", foreignKey: "appId", onDelete: "CASCADE" });
    this.belongsTo(models.User, { as: "createdBy", foreignKey: "createdById" });
  };

  return AppVersion;
}
