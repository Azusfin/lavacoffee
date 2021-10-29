import { readFileSync } from "fs"

export * from "./structures"
export * as Utils from "./utils"
export const version: string = JSON.parse(readFileSync(require.resolve("../package.json"), "utf-8")).version
