/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Container from "typedi";
import {
    ContainerMetadata,
    DynamicClassWrapper,
    MetadataScanner,
} from "../../IoC/scanners/MetadataScanner";
import { ControllerScanner } from "../../IoC/scanners/ControllerScanner";
import { REPOSITORY_TOKEN } from "./InjectRepository";
import { createUniqueControllerKey } from "../../../utils/scanner";
import { InstanceScanner } from "../../IoC/scanners/InstanceScanner";

export function Controller(path: string): ClassDecorator {
    return function (target: any) {
        const scanner = Container.get(ControllerScanner);
        const metadataScanner = Container.get(MetadataScanner);

        const params = Reflect.getMetadata("design:paramtypes", target) || [];

        // 리포지토리 주입을 위해 매개변수를 스캔합니다.
        const parameters: DynamicClassWrapper<any>[] = [];
        params.forEach((param: any, index: number) => {
            const repository = Reflect.getMetadata(
                REPOSITORY_TOKEN,
                param.prototype,
            );

            if (repository) {
                parameters.push(repository);
            } else {
                const TargetService = param;

                const instanceScanner = Container.get(InstanceScanner);

                if (TargetService) {
                    parameters.push(instanceScanner.wrap(TargetService));
                }
            }
        });

        // 컨트롤러 메타데이터를 등록합니다.
        const name = createUniqueControllerKey(target.name, scanner);
        scanner.set(name, {
            path,
            target,
            routers: metadataScanner.allMetadata(),
            type: "controller",
            parameters: parameters,
        });

        metadataScanner.clear();

        return target;
    };
}
