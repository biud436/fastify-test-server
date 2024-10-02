/* eslint-disable @typescript-eslint/no-explicit-any */
import Container from "typedi";
import {
    ErrorAdvice,
    ErrorMetadata,
} from "packages/ioc/scanners/MetadataScanner";
import { ErrorMetadataScanner } from "packages/ioc/scanners/ErrorMetadataScanner";

export const CATCH_METADATA = "CATCH_METADATA";
export function Catch(advice: ErrorAdvice = "throwing"): MethodDecorator {
    return function (
        target: any,
        propertyKey: string,
        descriptor: TypedPropertyDescriptor<any>,
    ) {
        const scanner = Container.get(ErrorMetadataScanner);
        const uniqueKey = scanner.createUniqueKey();

        Reflect.defineMetadata(CATCH_METADATA, true, target);

        scanner.set(uniqueKey, <ErrorMetadata>{
            target,
            handler: descriptor.value,
            advice,
        });
    } as MethodDecorator;
}
