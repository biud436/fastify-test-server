/* eslint-disable @typescript-eslint/no-explicit-any */

import { HttpRouterParameter } from "@stingerloom/common/HttpRouterParameter";
import { ReflectManager } from "@stingerloom/common/ReflectManager";
import { BODY_TOKEN, BodyParameter } from "@stingerloom/common/decorators/Body";
import { REQ_TOKEN } from "@stingerloom/common/decorators/Req";

/**
 * 특정 메소드의 매개변수 정보를 취득합니다.
 *
 * @param target
 * @param propertyKey
 * @returns
 */
export function getMethodParameters(target: any, propertyKey: string) {
    const params = ReflectManager.getParamTypes(target, propertyKey) || [];
    const parameters: HttpRouterParameter[] = [];

    // 매개변수 값을 저장하지만, 매개변수가 Req 객체일 경우에는 특별히 표시합니다.
    params.forEach((param, index) => {
        // Req 데코레이터가 붙은 매개변수의 인덱스를 가져옵니다.
        const reqIndex = Reflect.getMetadata(REQ_TOKEN, target, propertyKey);
        // Body 데코레이터가 붙은 매개변수의 인덱스를 가져옵니다.
        const bodyParam = Reflect.getMetadata(
            BODY_TOKEN,
            target,
            propertyKey,
        ) as BodyParameter;

        parameters.push({
            index,
            value: param,
            isReq: reqIndex === index,
            body: bodyParam,
        });
    });
    return parameters;
}
