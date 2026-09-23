import pg from "pg";
import { Sequelize, Model } from "sequelize";
import defineModels, { IModels } from "./models";

// Extend global type to include sequelize
declare global {
  var connecting: Promise<boolean>;
  var db: Sequelize | undefined;
  var models: IModels | undefined;
}

export async function connect() {
  if (!global.db) {
    global.connecting = new Promise(async (resolve, reject) => {
      console.log(Date.now(), "Connecting to DB");

      const dbURL: string = process.env.DB_URL || "";

      global.db = new Sequelize(dbURL, {
        logging: console.log,
        define: {
          underscored: true,
        },
        dialect: "postgres",
        dialectModule: pg,
      });
      console.log(Date.now(), "Connected to DB", 'Has DB: ', !!global.db, 'Has Models: ', !!global.models);
      await global.db.authenticate();
      console.log(Date.now(), "Authenticated", 'Has DB: ', !!global.db, 'Has Models: ', !!global.models);

      // Define models
      global.models = defineModels(global.db);
      console.log(Date.now(), "Model defined ", 'Has DB: ', !!global.db, 'Has Models: ', !!global.models);

      // Call associate methods
      Object.keys(global.db.models).forEach((modelName) => {
        if ("associate" in global.db!.models[modelName]) {
          (global.db!.models[modelName] as any).associate(global.db!.models);
        }
      });

      // await global.db!.sync({ force: true });

      resolve(true);
    });
    return global.connecting;
  } else {
    console.log("Found DB so returning connecting promise", 'Has DB: ', !!global.db, 'Has Models: ', !!global.models);
    return global.connecting;
  }
}

export async function getDBConnection() {
  if (global.db) return global.db;
  else console.log("Could not find DB", 'Has DB: ', !!global.db, 'Has Models: ', !!global.models);
  await connect();
  console.log("Passed Connect In Get DB", 'Has DB: ', !!global.db, 'Has Models: ', !!global.models);
  return global.db!;
}

export async function getDBModels() {
  if (global.models) return global.models;
  else console.log("Could not find models", 'Has DB: ', !!global.db, 'Has Models: ', !!global.models);
  await connect();
  console.log("Passed Connect In Get Models", 'Has DB: ', !!global.db, 'Has Models: ', !!global.models);
  return global.models!;
}
