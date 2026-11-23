# pragmatic-ui-unpack

The UI-unpack init container (`ghcr.io/pragmatic-tech-ai/pragmatic-ui-unpack`). It pulls one signed UI artifact from an
OCI registry, pins its manifest digest, verifies the signature against the trusted public keys, unpacks the version tree
(`<app>/<version>/ui/...`, `<app>/<version>/application.json`) and only then writes the `<app>/live` pointer, then exits.
Any failure exits non-zero with a fixed message that never echoes its input.

Split out of pragmatic-server (seed commit `chore: seed from pragmatic-server@2a2e8138`); image name, environment
variables and component descriptor are unchanged.

## Configuration

Every variable is required (the component descriptor, `src/ui-unpack-component.ts`, declares all but the root of trust):
`PRAGMATIC_UI_REGISTRY_BASE`, `PRAGMATIC_UI_REPO`, `PRAGMATIC_UI_ARTIFACT_TAG`, `PRAGMATIC_UI_SIG_TAG`,
`PRAGMATIC_UI_MANIFEST_DIGEST`, `PRAGMATIC_UI_APP_NAME`, `PRAGMATIC_UI_APP_VERSION`, `PRAGMATIC_UI_TRUST_ROOT_REF`,
`PRAGMATIC_UI_DATA_DIR`, `PRAGMATIC_UI_TRUST_DIR`.

At start the mounted `pragmatic-config-pragmatic-ui-unpack` (the tenant admin console's applied configuration) is laid
over these variables; one the unpacker cannot start with exits 78 with the reason. The root of trust
(`PRAGMATIC_UI_TRUST_ROOT_REF`, `PRAGMATIC_UI_TRUST_DIR`) is the platform's: it is left out of the descriptor, so no
tenant configuration can set it.

## Development

Packages come from GitHub Packages (`@pragmatic-tech-ai` scope, `.npmrc` reads the token from `NODE_AUTH_TOKEN`).

    npm ci
    npm run build
    npm test
    npm run typecheck
    npx pragmatic-closure-check

The image is built from `Dockerfile` with `docker-bake.hcl` in two steps (the header of either file shows the commands).
CI and the image release (tag `v<version>`, equal to `package.json`'s version) run pragmatic-shared's reusable container
workflows. The build files are rendered by `pragmatic-container-template` (`@pragmatic-tech-ai/pragmatic-release-toolkit`):

    npx pragmatic-container-template render --app pragmatic-ui-unpack --entry src/bin/pragmatic-ui-unpack.ts --out .
