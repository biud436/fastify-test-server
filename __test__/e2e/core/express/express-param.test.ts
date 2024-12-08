import axios from "axios";
import {
    Controller,
    ExpressServerFactory,
    Get,
    Module,
    ModuleOptions,
    Param,
    ServerBootstrapApplication,
} from "@stingerloom/core";

describe("파라미터 테스트", () => {
    let application: TestServerApplication;

    class Point {
        private x: number;
        private y: number;

        constructor(args: string) {
            const [x, y] = args.split(",");

            this.x = parseInt(x, 10);
            this.y = parseInt(y, 10);
        }

        getX() {
            return this.x;
        }

        getY() {
            return this.y;
        }
    }

    @Controller("/")
    class AppController {
        @Get("/blog/:id/:title")
        async resolveIdAndTitle(
            @Param("id|0") id: number,
            @Param("title") title: string,
        ) {
            return { id, title };
        }

        @Get("/point/:x")
        async resolveNameAndTitle(@Param("x") point: Point) {
            return point;
        }

        @Get("/user/:id")
        async resolveUser(
            @Param("id|8E1527BA-2C2A-4A6F-9C32-9567A867050A") id: string,
        ) {
            console.log("id", id);
            return id;
        }
        @Get("/admin/:id")
        async resolveAdmin(@Param("id") id: string) {
            return id;
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
            });
        }
    }

    beforeAll((done) => {
        application = new TestServerApplication(new ExpressServerFactory());
        application.on("start", () => {
            done();
        });

        application.start();
    });

    afterAll(async () => {
        await application.stop();
    });

    it(":id와 :title 파라미터를 받아서 객체로 반환하는지 테스트", async () => {
        const res = await axios.get("http://localhost:3002/blog/1/test");

        expect(res.data).toEqual({ id: 1, title: "test" });
    });

    it(":id가 숫자가 아닌 경우, 400 오류를 반환하는지 테스트", async () => {
        expect(async () => {
            await axios.get("http://localhost:3002/blog/test/test");
        }).rejects.toThrow("Request failed with status code 400");
    });

    it(":id가 실수인 경우, 실수로 변환하는지 테스트", async () => {
        const res = await axios.get("http://localhost:3002/blog/1.5/test");

        expect(res.data).toEqual({ id: 1.5, title: "test" });
    });

    it(":id가 음수 값인 경우, 음수로 변환하는지 테스트", async () => {
        const res = await axios.get("http://localhost:3002/blog/-1/test");

        expect(res.data).toEqual({ id: -1, title: "test" });
    });

    it(":x 파라미터를 받아서 객체로 반환하는지 테스트", async () => {
        const res = await axios.get("http://localhost:3002/point/50,25");

        expect(res.data).toEqual({ x: 50, y: 25 });
    });
    it("디폴트 파라미터를 받아서 객체로 반환하는지 테스트", async () => {
        const res = await axios.get("http://localhost:3002/blog//test");

        expect(res.data).toEqual({ id: 0, title: "test" });
    });
    it("디폴트 파라미터를 받아서 객체로 반환하는지 테스트", async () => {
        const res = await axios.get("http://localhost:3002/user/");

        expect(res.data).toEqual("8E1527BA-2C2A-4A6F-9C32-9567A867050A");
    });
    it("디폴트 파라미터를 받아서 객체로 반환하는지 테스트 (Admin)", async () => {
        const res = await axios.get("http://localhost:3002/admin/");

        expect(res.data).toEqual("");
    });
    it("파라미터를 받아서 객체로 반환하는지 테스트", async () => {
        const res = await axios.get(
            "http://localhost:3002/user/D951719C-E8E3-4E40-ABA7-2548AF358702",
        );

        expect(res.data).toEqual("D951719C-E8E3-4E40-ABA7-2548AF358702");
    });
});
