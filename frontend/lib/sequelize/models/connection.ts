import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { IModels } from ".";
import { IUserInstance } from "./user";
import { IOrganizationInstance } from "./organization";
import type { ConnectionSchema } from "@/lib/google/schema";

export interface ConnectionSheet {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface IConnectionInstance extends Model {
  id: string;
  organizationId: string;
  ownerUserId: string;
  type: "google_sheets";
  spreadsheetId: string;
  title: string | null;
  sheets: ConnectionSheet[];
  schema: ConnectionSchema | null;
  schemaFetchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: IOrganizationInstance;
  owner?: IUserInstance;
}

export interface IConnectionModel extends ModelStatic<IConnectionInstance> {
  associate(models: IModels): void;
  findOrCreateForSheet(
    organization: IOrganizationInstance,
    ownerUser: IUserInstance,
    spreadsheetId: string
  ): Promise<IConnectionInstance>;
}

export default function defineConnectionModel(sequelize: Sequelize): IConnectionModel {
  const Connection = sequelize.define(
    "Connection",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      ownerUserId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "google_sheets",
        validate: { isIn: [["google_sheets"]] },
      },
      spreadsheetId: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      title: {
        type: DataTypes.STRING,
      },
      sheets: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
      },
      schema: {
        type: DataTypes.JSONB,
      },
      schemaFetchedAt: {
        type: DataTypes.DATE,
      },
    },
    {
      indexes: [{ unique: true, fields: ["organization_id", "spreadsheet_id"] }],
    }
  ) as IConnectionModel;

  Connection.associate = function associate(models) {
    this.belongsTo(models.Organization, {
      as: "organization",
      foreignKey: "organizationId",
      onDelete: "CASCADE",
    });
    this.belongsTo(models.User, {
      as: "owner",
      foreignKey: "ownerUserId",
    });
  };

  Connection.findOrCreateForSheet = async function findOrCreateForSheet(
    organization: IOrganizationInstance,
    ownerUser: IUserInstance,
    spreadsheetId: string
  ) {
    const [connection] = await this.findOrCreate({
      where: { organizationId: organization.id, spreadsheetId },
      defaults: { ownerUserId: ownerUser.id, type: "google_sheets" },
    });
    return connection;
  };

  return Connection;
}
