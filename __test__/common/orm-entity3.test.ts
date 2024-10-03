/* eslint-disable @typescript-eslint/no-explicit-any */
import "reflect-metadata";
import {
    Controller,
    Get,
    Module,
    ModuleOptions,
    OnModuleInit,
} from "@stingerloom/common";
import {
    Column,
    Entity,
    InjectEntityManager,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "@stingerloom/orm/decorators";
import configService from "@stingerloom/common/ConfigService";
import { EntityManager } from "@stingerloom/orm/core/EntityManager";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";
import { DataSourceOptions } from "typeorm";
import axios from "axios";
import { ServerBootstrapApplication } from "@stingerloom/bootstrap/ServerBootstrapApplication";

describe("ORM Entity 외래키 생성 테스트", () => {
    let application: TestServerApplication;

    // TODO: typeorm의 의존성을 제거해야 함
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

    /**
     * 상품 엔티티
     */
    @Entity()
    class Product {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column({
            length: 255,
            nullable: false,
            type: "varchar",
        })
        name!: string;

        @Column({
            type: "int",
            nullable: false,
            length: 11,
            // default: 0,
        })
        price!: number;
    }

    @Entity()
    class Order {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column({
            type: "int",
            nullable: false,
            length: 11,
            // name: "product_id", 면 생성이 되질 않음
        })
        productId!: number;

        @ManyToOne(() => Product, (product) => product.id, {
            joinColumn: "productId",
        })
        product!: Product;
    }

    @Controller("/")
    class AppController implements OnModuleInit {
        constructor(
            @InjectEntityManager()
            private readonly entityManager: EntityManager,
            // @InjectRepository(Order)
            // private readonly orderRepository: BaseRepository<Order>, // ! 제대로 주입이 되질 않음
        ) {}

        async onModuleInit(): Promise<void> {}

        @Get("/hello")
        async resolvePerson() {
            const productRepository = this.entityManager.getRepository(Product);

            const product = new Product();
            product.name = "테스트 상품";
            product.price = 10000;

            await productRepository.save(product); // INSERT 후 SELECT를 해야하는데 되질 않음

            const products = await productRepository.find({
                where: {
                    id: 1,
                },
                orderBy: {
                    id: "DESC",
                },
                take: 1,
            });

            console.log((products as any).id);

            const orderRepository = this.entityManager.getRepository(Order);

            const order = new Order();
            order.productId = (products as Product).id;

            await orderRepository.save(order);

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