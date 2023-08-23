/* eslint-disable @typescript-eslint/no-explicit-any */
import Container from "typedi";
import { Metadata, MetadataScanner } from "../../IoC/scanners/MetadataScanner";
import { HttpRouterParameter } from "../HttpRouterParameter";
import { getMethodParameters } from "../../../utils/extractor";
import { PATH } from "./PATH_KEY";

export function Delete(path = "") {
    return function (
        target: object,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) {
        const parameters: HttpRouterParameter[] = getMethodParameters(
            target,
            propertyKey,
        );

        Reflect.defineMetadata(PATH, path, descriptor.value);

        const scanner = Container.get(MetadataScanner);
        const uniqueKey = scanner.createUniqueKey();
        scanner.set<Metadata>(uniqueKey, {
            path,
            method: "DELETE",
            target,
            router: descriptor.value,
            parameters,
        });
    };
}
