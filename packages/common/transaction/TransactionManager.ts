/* eslint-disable @typescript-eslint/no-explicit-any */
import { InstanceScanner } from "@stingerloom/IoC";
import { ClazzType } from "../RouterMapper";
import { ReflectManager } from "../ReflectManager";
import Database from "../Database";
import {
    DEFAULT_ISOLATION_LEVEL,
    TRANSACTION_ENTITY_MANAGER,
    TRANSACTION_ISOLATE_LEVEL,
    TransactionIsolationLevel,
} from "../decorators";

import { InternalServerException } from "@stingerloom/error";
import { Logger } from "../Logger";
import { TransactionEntityManagerConsumer } from "./TransactionEntityManagerConsumer";
import { TransactionQueryRunnerConsumer } from "./TransactionQueryRunnerConsumer";

export class TransactionManager {
    private static LOGGER = new Logger();
    private static txManagerConsumer = new TransactionEntityManagerConsumer();
    private static txQueryRunnerConsumer = new TransactionQueryRunnerConsumer();

    public static async checkTransactionalZone(
        TargetInjectable: ClazzType<any>,
        targetInjectable: any,
        instanceScanner: InstanceScanner,
    ) {
        if (ReflectManager.isTransactionalZone(TargetInjectable)) {
            TransactionManager.LOGGER.info("트랜잭션 존이 발견되었습니다.");

            const getPrototypeMethods = (obj: any) => {
                const properties = new Set();
                let currentObj = obj;
                do {
                    Object.getOwnPropertyNames(currentObj).map((item) =>
                        properties.add(item),
                    );

                    currentObj = Object.getPrototypeOf(currentObj);
                } while (
                    Object.getPrototypeOf(currentObj) &&
                    Object.getPrototypeOf(currentObj) !== null
                );

                return [...properties.keys()].filter(
                    (item) => typeof obj[item as any] === "function",
                );
            };

            // 모든 메소드를 순회합니다.
            for (const method of getPrototypeMethods(targetInjectable)) {
                // 데이터베이스 인스턴스를 가져옵니다.
                const database = instanceScanner.get(Database) as Database;

                // 메소드가 트랜잭셔널이라면
                if (
                    ReflectManager.isTransactionalZoneMethod(
                        targetInjectable,
                        method as any,
                    )
                ) {
                    const wrapTransaction = () => {
                        const originalMethod = targetInjectable[method as any];

                        // 트랜잭션 격리 레벨을 가져옵니다.
                        const transactionIsolationLevel =
                            TransactionManager.getTransactionIsolationLevel(
                                targetInjectable,
                                method,
                            );

                        // 트랜잭션을 시작합니다.
                        const dataSource = database.getDataSource();
                        const entityManager = dataSource.manager;

                        // 트랜잭션 엔티티 매니저가 필요한가?
                        const transactionalEntityManager =
                            TransactionManager.getTxManager(
                                targetInjectable,
                                method,
                            );

                        const callback = async (...args: any[]) => {
                            return new Promise((resolve, reject) => {
                                if (transactionalEntityManager) {
                                    // 트랜잭션 엔티티 매니저를 실행합니다.
                                    this.txManagerConsumer.execute(
                                        entityManager,
                                        transactionIsolationLevel,
                                        targetInjectable,
                                        method,
                                        args,
                                        originalMethod,
                                        resolve,
                                        reject,
                                    );
                                } else {
                                    this.txQueryRunnerConsumer.execute(
                                        dataSource,
                                        transactionIsolationLevel,
                                        targetInjectable,
                                        method,
                                        originalMethod,
                                        reject,
                                        resolve,
                                        args,
                                    );
                                }
                            });
                        };

                        return callback;
                    };

                    try {
                        // 기존 메소드를 대체합니다.
                        targetInjectable[method as any] = wrapTransaction();
                    } catch (err: any) {
                        throw new InternalServerException(
                            `트랜잭션을 실행하는 도중 오류가 발생했습니다: ${err.message}`,
                        );
                    }
                }
            }
        }
    }

    /**
     * 트랜잭션 엔티티 매니저가 필요한 지 여부를 확인합니다.
     *
     * @param targetInjectable
     * @param method
     * @returns
     */
    private static getTxManager(
        targetInjectable: any,
        method: unknown,
    ): boolean {
        return Reflect.getMetadata(
            TRANSACTION_ENTITY_MANAGER,
            targetInjectable,
            method as any,
        ) as boolean;
    }

    /**
     * 트랜잭션 격리 수준을 가져옵니다.
     *
     * @param targetInjectable
     * @param method
     * @returns
     */
    private static getTransactionIsolationLevel(
        targetInjectable: any,
        method: unknown,
    ): TransactionIsolationLevel {
        return (Reflect.getMetadata(
            TRANSACTION_ISOLATE_LEVEL,
            targetInjectable,
            method as any,
        ) || DEFAULT_ISOLATION_LEVEL) as TransactionIsolationLevel;
    }
}