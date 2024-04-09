/* eslint-disable @typescript-eslint/no-unused-vars */

import { ServerBootstrapApplication } from "@stingerloom/bootstrap";
import {
    Controller,
    Get,
    Module,
    ModuleOptions,
    OnModuleInit,
    Query,
} from "@stingerloom/common";
import { DataSourceOptions } from "typeorm";
import configService from "@stingerloom/common/ConfigService";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import axios from "axios";
import { DatabaseClient } from "@stingerloom/orm";
import { MySqlDriver } from "@stingerloom/orm/dialects";
import { Entity } from "@stingerloom/orm/decorators/Entity";
import { Column } from "@stingerloom/orm/decorators";

describe("커스텀 ORM 테스트", () => {
    let application: TestServerApplication;
    const option: DataSourceOptions = {
        type: "mariadb",
        host: configService.get<string>("DB_HOST"),
        port: configService.get<number>("DB_PORT"),
        database: configService.get<string>("DB_NAME"),
        password: configService.get<string>("DB_PASSWORD"),
        username: configService.get<string>("DB_USER"),
        entities: [__dirname + "/entity/*.ts", __dirname + "/entity/map/*.ts"],
        namingStrategy: new SnakeNamingStrategy(),
        synchronize: true,
        logging: true,
    };

    @Entity({
        name: "node",
    })
    class Node {
        @Column({
            length: 255,
            nullable: false,
            type: "varchar",
        })
        name!: string;

        @Column({
            length: 255,
            nullable: false,
            type: "varchar",
        })
        type!: string;

        @Column({
            length: 255,
            nullable: false,
            type: "varchar",
        })
        description!: string;
    }

    @Controller("/")
    class AppController implements OnModuleInit {
        async onModuleInit(): Promise<void> {
            const client = DatabaseClient.getInstance();

            const connector = await client.connect({
                host: configService.get<string>("DB_HOST"),
                port: configService.get<number>("DB_PORT"),
                database: configService.get<string>("DB_NAME"),
                password: configService.get<string>("DB_PASSWORD"),
                username: configService.get<string>("DB_USER"),
                type: "mysql",
                entities: [Node],
                logging: true,
            });

            const driver = new MySqlDriver(connector);

            const userInformation = await driver.getSchemas("test.user");

            console.log(userInformation);
        }

        @Get("/hello")
        async resolvePerson() {
            return "Hello, World!";
        }
    }

    @Module({
        controllers: [AppController],
        providers: [],
    })
    class TestServerApplication extends ServerBootstrapApplication {
        override beforeStart(): void {
            this.moduleOptions = ModuleOptions.merge({
                controllers: [],
                providers: [],
                configuration: option,
            });
        }
    }

    beforeAll((done) => {
        application = new TestServerApplication();
        application.on("start", () => {
            done();
        });

        application.start();
    });

    afterAll(async () => {
        await application.stop();
    });

    it("Hello, World!", async () => {
        const { data } = await axios.get("http://localhost:3002/hello");

        expect(data).toBe("Hello, World!");
    });
});