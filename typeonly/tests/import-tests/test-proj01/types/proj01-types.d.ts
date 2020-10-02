import { Main } from "@hello/world"
import { Other } from "@hello/world/types/other"
import { SimplePackage } from "simple-package"
import { SimpleOther } from "simple-package/types/simple-other"

export interface Proj01 {
  main: Main
  other: Other
  simplePackage: SimplePackage
  simpleOther: SimpleOther
}