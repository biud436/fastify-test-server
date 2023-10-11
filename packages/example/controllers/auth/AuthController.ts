/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
    Body,
    Controller,
    Get,
    OnApplicationShutdown,
    Post,
    UseGuard,
} from "@stingerloom/common";
import { Session } from "@stingerloom/common/decorators/Session";
import { SessionObject } from "@stingerloom/common";
import { AuthService } from "./AuthService";
import { LoginUserDto } from "./dto/LoginUserDto";
import { SessionGuard } from "./guards/SessionGuard";
import { ResultUtils } from "@stingerloom/example/common/ResultUtils";
import { User } from "@stingerloom/example/common/decorators/User";
import { UserId } from "@stingerloom/example/common/decorators/UserId";
import { Autowired } from "@stingerloom/common/decorators/Autowired";

@Controller("/auth")
export class AuthController {
    @Autowired()
    private readonly authService!: AuthService;

    @Post("/login")
    async login(
        @Session() session: SessionObject,
        @Body() loginUserDto: LoginUserDto,
    ) {
        return await this.authService.login(session, loginUserDto);
    }

    @Get("/session")
    async checkSession(@Session() session: SessionObject) {
        return await this.authService.checkSession(session);
    }

    @Get("/transaction")
    async checkTransaction() {
        return await this.authService.checkTransaction();
    }

    @Get("/transaction2")
    async checkTransaction2() {
        return await this.authService.checkTransaction2();
    }

    @Get("/session-guard")
    @UseGuard(SessionGuard)
    async checkSessionGuard(
        @Session() session: SessionObject,
        @User() user: any,
        @UserId() userId: string,
    ) {
        return ResultUtils.success("세션 가드 통과", {
            user,
            userId,
        });
    }

    @Get("/transaction4")
    async checkTransaction4() {
        return await this.authService.checkTransaction4();
    }
}
