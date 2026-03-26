import 'express';
import { ApiVersionContext } from '../common/versioning';

declare module 'express-serve-static-core' {
  interface Request {
    apiVersionContext?: ApiVersionContext;
  }
}
