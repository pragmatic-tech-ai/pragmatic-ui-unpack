# pragmatic-ui-unpack (rendered by pragmatic-container-template), in two steps. The first exports the component descriptor, its
# digest and the override that labels the image with that digest into .components; the second bakes the image with it:
#   NPMRC_FILE=$HOME/.npmrc docker buildx bake -f docker-bake.hcl --allow=fs.read=$HOME/.npmrc components
#   NPMRC_FILE=$HOME/.npmrc VERSION=0.1.0 GIT_SHA=$(git rev-parse HEAD) docker buildx bake -f docker-bake.hcl \
#     -f .components/docker-bake.components.json --allow=fs.read=$HOME/.npmrc pragmatic-ui-unpack
# The image target baked without the override stops at its component stage (no COMPONENT_DIGEST to match).
# NPMRC_FILE names an .npmrc able to read @pragmatic-tech-ai packages from GitHub Packages; it reaches the build only
# as the BuildKit secret `npmrc`, never as a layer.

variable "VERSION" {
  default = "dev"
}

variable "GIT_SHA" {
  default = "local"
}

variable "REGISTRY" {
  default = "ghcr.io/pragmatic-tech-ai"
}

variable "NPMRC_FILE" {
  default = ""
}

# Comma-separated; CI and the release bake one arch per native runner (PLATFORMS=linux/arm64 there).
variable "PLATFORMS" {
  default = "linux/amd64"
}

group "default" {
  targets = ["pragmatic-ui-unpack"]
}

target "_app" {
  context    = "."
  dockerfile = "Dockerfile"
  # Without NPMRC_FILE the build stops at its first `required=true` secret mount, naming the missing secret.
  secret     = NPMRC_FILE == "" ? [] : ["id=npmrc,src=${NPMRC_FILE}"]
  # No version or revision label: either would change the image config (so its digest) on every release.
  labels = {
    "org.opencontainers.image.source" = "https://github.com/pragmatic-tech-ai/pragmatic-ui-unpack"
  }
}

# Step one: the component descriptor, its digest and the bake override, exported as files (one platform: the descriptor
# is the same on every arch). Not an image.
target "components" {
  inherits  = ["_app"]
  target    = "components"
  platforms = [split(",", PLATFORMS)[0]]
  output    = ["type=local,dest=.components"]
}

target "pragmatic-ui-unpack" {
  inherits  = ["_app"]
  target    = "pragmatic-ui-unpack"
  platforms = split(",", PLATFORMS)
  tags      = ["${REGISTRY}/pragmatic-ui-unpack:${VERSION}", "${REGISTRY}/pragmatic-ui-unpack:git-${GIT_SHA}"]
}
