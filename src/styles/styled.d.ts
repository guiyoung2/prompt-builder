import "styled-components";
import type { AppTheme } from "./theme";

declare module "styled-components" {
  // styled-components의 표준 module augmentation 패턴 (빈 interface가 의도된 형태)
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
