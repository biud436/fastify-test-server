import { MetadataScanner } from "@stingerloom/core/IoC";
import { EntityManager, QueryRunner } from "typeorm";
import { TransactionalRollbackException } from "../decorators/Transactional";
import { TxContext } from "./EntityManagerContextQueue";
export interface RawTransactionMetadata {
    targetClass: InstanceType<any>;
    currentMethod: string;
}
export declare class RawTransactionScanner extends MetadataScanner {
    static readonly GLOBAL_LOCK = "GLOBAL_LOCK";
    private txQueryRunner?;
    private txEntityManager?;
    private contextQueue;
    /**
     * 논리 트랜잭션의 횟수
     */
    private logicalTransactionCount;
    /**
     * 저장된 토큰을 삭제합니다.
     */
    delete(token: string): void;
    /**
     * 해당 토큰이 존재하는지 확인합니다.
     * 이는 메소드가 잠겨있는지 확인하는데 사용됩니다.
     *
     * @param token
     * @returns
     */
    isLock(token: string): boolean;
    /**
     * 메소드를 토큰 단위의 락을 사용하여 잠금 처리합니다.
     * @param token
     * @param targetClass
     * @param currentMethod
     */
    lock(token: string, targetClass: InstanceType<any>, currentMethod: string): void;
    /**
     * 잠금을 해제합니다.
     *
     * @param token
     */
    unlock(token: string): void;
    /**
     * 새로운 논리 트랜잭션을 추가합니다.
     */
    addLogicalTransactionCount(): void;
    /**
     * 논리 트랜잭션 횟수를 구합니다.
     */
    getLogicalTransactionCount(): number;
    /**
     * 논리 트랜잭션을 하나 제거합니다.
     */
    subtractLogicalTransactionCount(): void;
    /**
     * 논리 트랜잭션 횟수를 초기화합니다.
     */
    resetLogicalTransactionCount(): void;
    /**
     * 논리 트랜잭션이 모두 커밋되었는지 확인합니다.
     */
    isCommittedAllLogicalTransaction(): boolean;
    /**
     * 프로세스 단위에서 메소드를 잠금 처리합니다.
     * 잠금 처리된 메소드는 해제되기 전까지 다른 영역에서 접근할 수 없습니다.
     * 이 메소드는 트랜잭션 데코레이터가 적용된 메소드 안에서
     * 트랜잭션 데코레이터가 적용된 메소드를 다시 호출했는지 확인할 때 사용됩니다.
     *
     * 보통은 이때 외부/내부 트랜잭션으로 나뉘고 하나의 물리 트랜잭션으로 통합합니다.
     *
     * @parm options
     */
    globalLock({ queryRunner, transactionIsolationLevel, entityManager, isEntityManager, propagation, }: TxContext): Promise<void>;
    /**
     * 새로운 트랜잭션을 시작합니다.
     */
    newTransaction({ queryRunner, transactionIsolationLevel, propagation, entityManager, }: TxContext): Promise<void>;
    /**
     * Gets the transaction query runner.
     *
     */
    getTxQueryRunner(): QueryRunner | undefined;
    getTxEntityManager(): EntityManager | undefined;
    /**
     * 프로세스 단위 잠금을 해제합니다.
     */
    globalUnlock(): void;
    /**
     * 프로세스에 트랜잭션 잠금이 적용되었는지 확인합니다.
     * @returns
     */
    isGlobalLock(): boolean;
    /**
     * 트랜잭션 롤백 Exception 여부를 확인합니다.
     *
     * @param targetInjectable
     * @param method
     * @returns
     */
    getTransactionRollbackException(targetInjectable: any, method: string): TransactionalRollbackException | null;
    checkRollbackException(targetInjectable: any, method: string, error?: any): void;
}