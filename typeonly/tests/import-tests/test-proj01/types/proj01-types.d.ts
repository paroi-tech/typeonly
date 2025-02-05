import type { Main } from "@hello/world";
import type { Other } from "@hello/world/types/other";
import type { SimplePackage } from "simple-package";
import type { SimpleOther } from "simple-package/types/simple-other";

export interface Proj01 {
  main: Main;
  other: Other;
  simplePackage: SimplePackage;
  simpleOther: SimpleOther;
}
