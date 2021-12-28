import { join } from "path"
import { readFileSync } from "fs"

export * from "./structures"
export * as Utils from "./utils"
export { FilterUtils as CoffeeFilters } from "./utils"
export const version: string = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8")).version
