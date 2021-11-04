import { ResponseData } from "undici/types/dispatcher";
import { RoutePlanners } from "../utils";
import { check } from "../utils/decorators/validators";
import { CoffeeNode } from "./CoffeeNode";

export class CoffeeRoutePlanner {
  public constructor(
    public node: CoffeeNode
  ) {}

  /** Get the routePlanner status */
  public async status(): Promise<RoutePlanners | undefined> {
    const res = await this.node.request<RoutePlanners>("/routeplanner/status")
    return res.class ? res : undefined
  }

  /** Unmark a failed address */
  // eslint-disable-next-line @typescript-eslint/member-ordering
  @check((method, address: string) => {
    if (
      typeof address !== "string" || !address
    ) throw new TypeError("Parameter 'address' must be present and be a non-empty string")
    return method(address)
  })
  public async freeAddress(address: string): Promise<boolean> {
    const res = await this.node.post(
      "/routeplanner/free/address",
      { address },
      true
    ) as ResponseData

    return res.statusCode === 204
  }

  /** Unmark all failed address */
  public async freeAllAddress(): Promise<boolean> {
    const res = await this.node.post(
      "/routeplanner/free/all",
      undefined,
      true
    ) as ResponseData

    return res.statusCode === 204
  }
}
