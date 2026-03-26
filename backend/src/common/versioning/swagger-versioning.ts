import { OpenAPIObject } from '@nestjs/swagger';

export function buildVersionedSwaggerDocument(
  document: OpenAPIObject,
  version: string,
): OpenAPIObject {
  const versionPrefix = `/api/v${version}/`;

  return {
    ...document,
    info: {
      ...document.info,
      version: `v${version}`,
      title: `${document.info.title} v${version}`,
    },
    paths: Object.fromEntries(
      Object.entries(document.paths).filter(([path]) =>
        path.startsWith(versionPrefix),
      ),
    ),
  };
}
