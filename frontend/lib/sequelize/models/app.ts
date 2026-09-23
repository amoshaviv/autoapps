import { Sequelize, DataTypes, Model, ModelStatic } from "sequelize";
import { customAlphabet } from "nanoid";
import { kebabCase } from "change-case";
import { IModels } from ".";
import { IUserInstance } from "./user";
import { IOrganizationInstance } from "./organization";
import { IConnectionInstance } from "./connection";
import { IAppVersionInstance } from "./app-version";

// nanoid's default alphabet without "-" and "_", so links survive copy/paste
const newShortId = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  10
);

export interface IAppInstance extends Model {
  id: string;
  organizationId: string;
  connectionId: string;
  createdById: string;
  slug: string;
  shortId: string;
  name: string;
  description: string | null;
  icon: string | null;
  status: "draft" | "published";
  draftVersionId: string | null;
  publishedVersionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  organization?: IOrganizationInstance;
  connection?: IConnectionInstance;
  addVersion(
    spec: Record<string, unknown>,
    summary: string | null,
    user: IUserInstance
  ): Promise<IAppVersionInstance>;
  publish(): Promise<IAppInstance>;
  canEdit(user: IUserInstance, role: string): boolean;
}

export interface IAppModel extends ModelStatic<IAppInstance> {
  associate(models: IModels): void;
  findUniqueSlug(possibleSlug: string, organization: IOrganizationInstance): Promise<string>;
  createDraft(args: {
    organization: IOrganizationInstance;
    connection: IConnectionInstance;
    user: IUserInstance;
    name: string;
    spec: Record<string, unknown>;
    summary: string | null;
  }): Promise<{ app: IAppInstance; version: IAppVersionInstance }>;
  findBySlugInOrg(organizationSlug: string, appSlug: string): Promise<IAppInstance | null>;
  findByShortId(shortId: string): Promise<IAppInstance | null>;
}

export default function defineAppModel(sequelize: Sequelize): IAppModel {
  const App = sequelize.define(
    "App",
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
      connectionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdById: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      shortId: {
        type: DataTypes.STRING(10),
        allowNull: false,
        unique: true,
        defaultValue: () => newShortId(),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: true },
      },
      description: {
        type: DataTypes.TEXT,
      },
      icon: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "draft",
        validate: { isIn: [["draft", "published"]] },
      },
      draftVersionId: {
        type: DataTypes.UUID,
      },
      publishedVersionId: {
        type: DataTypes.UUID,
      },
    },
    {
      indexes: [{ unique: true, fields: ["organization_id", "slug"] }],
    }
  ) as IAppModel;

  App.associate = function associate(models) {
    this.belongsTo(models.Organization, {
      as: "organization",
      foreignKey: "organizationId",
      onDelete: "CASCADE",
    });
    this.belongsTo(models.Connection, { as: "connection", foreignKey: "connectionId" });
    this.belongsTo(models.User, { as: "createdBy", foreignKey: "createdById" });
    this.hasMany(models.AppVersion, { as: "versions", foreignKey: "appId" });
    this.hasMany(models.AppMessage, { as: "messages", foreignKey: "appId" });
    this.hasMany(models.AppActivity, { as: "activities", foreignKey: "appId" });
    // app_versions already references apps; no FK back, to keep sync() acyclic
    this.belongsTo(models.AppVersion, {
      as: "draftVersion",
      foreignKey: "draftVersionId",
      constraints: false,
    });
    this.belongsTo(models.AppVersion, {
      as: "publishedVersion",
      foreignKey: "publishedVersionId",
      constraints: false,
    });
  };

  App.findUniqueSlug = async function findUniqueSlug(
    possibleSlug: string,
    organization: IOrganizationInstance
  ) {
    const base = possibleSlug || "app";
    let app = await this.findOne({ where: { organizationId: organization.id, slug: base } });
    if (!app) return base;

    let suffix = 0;
    while (app) {
      suffix += 1;
      app = await this.findOne({
        where: { organizationId: organization.id, slug: base + suffix },
      });
    }
    return base + suffix;
  };

  App.createDraft = async function createDraft({
    organization,
    connection,
    user,
    name,
    spec,
    summary,
  }) {
    const { AppVersion } = sequelize.models as unknown as IModels;
    const slug = await this.findUniqueSlug(kebabCase(name), organization);

    return sequelize.transaction(async (transaction) => {
      const app = await this.create(
        {
          organizationId: organization.id,
          connectionId: connection.id,
          createdById: user.id,
          name,
          slug,
          description: (spec.description as string | undefined) ?? null,
          icon: (spec.icon as string | undefined) ?? null,
        },
        { transaction }
      );
      const version = await AppVersion.create(
        { appId: app.id, number: 1, spec, summary, createdById: user.id },
        { transaction }
      );
      await app.update({ draftVersionId: version.id }, { transaction });
      return { app, version };
    });
  };

  App.findBySlugInOrg = async function findBySlugInOrg(organizationSlug: string, appSlug: string) {
    return this.findOne({
      where: { slug: appSlug },
      include: [
        { association: "organization", where: { slug: organizationSlug } },
        { association: "connection" },
      ],
    });
  };

  App.findByShortId = async function findByShortId(shortId: string) {
    return this.findOne({
      where: { shortId },
      include: [{ association: "organization" }, { association: "connection" }],
    });
  };

  (App.prototype as IAppInstance).addVersion = async function addVersion(
    spec: Record<string, unknown>,
    summary: string | null,
    user: IUserInstance
  ) {
    const { AppVersion } = sequelize.models as unknown as IModels;
    return sequelize.transaction(async (transaction) => {
      const last = (await AppVersion.max("number", {
        where: { appId: this.id },
        transaction,
      })) as number | null;
      const version = await AppVersion.create(
        { appId: this.id, number: (last ?? 0) + 1, spec, summary, createdById: user.id },
        { transaction }
      );
      await this.update({ draftVersionId: version.id }, { transaction });
      return version;
    });
  };

  (App.prototype as IAppInstance).publish = async function publish() {
    return this.update({ publishedVersionId: this.draftVersionId, status: "published" });
  };

  (App.prototype as IAppInstance).canEdit = function canEdit(user: IUserInstance, role: string) {
    return this.createdById === user.id || role === "admin" || role === "owner";
  };

  return App;
}
