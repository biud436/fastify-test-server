import { MetadataScanner } from "@stingerloom/IoC/scanners";
import { Service } from "typedi";

@Service()
export class RawTransactionScanner extends MetadataScanner {}
