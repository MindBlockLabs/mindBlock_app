"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || "your_username",
    password: process.env.DB_PASSWORD || "your_password",
    database: process.env.DB_NAME || "your_database",
    entities: [__dirname + "/src/**/*.entity{.ts,.js}"],
    migrations: [__dirname + "/migrations/*{.ts,.js}"],
    synchronize: false,
});
//# sourceMappingURL=data-source.js.map