import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { UiUnpackComponent } from '../ui-unpack-component.js'
import { ComponentGolden } from './component-golden.js'
import { ComponentSources } from './component-sources.js'

class UiUnpackComponentFixture
{
    public static readonly Here = dirname(fileURLToPath(import.meta.url))
    public static readonly Golden = join(UiUnpackComponentFixture.Here, 'fixtures', 'pragmatic-ui-unpack.component.json')
    public static readonly Digest = 'sha256:982457c4971f66c29ef05ee11a7872d7945d18832aa5fabb91d64a11fc93ae05'
    public static readonly Readers = [['..', 'bin', 'pragmatic-ui-unpack.ts']].map(path => join(UiUnpackComponentFixture.Here, ...path))
    /** Platform-owned: read from the environment the manifests render, never tenant-configurable, by reason. */
    public static readonly PlatformOwned: Readonly<Record<string, readonly string[]>> = {
        'the hive root of trust the artifact signature must chain to': ['PRAGMATIC_UI_TRUST_ROOT_REF', 'PRAGMATIC_UI_TRUST_DIR'],
        // One configuration is applied to every environment: a tenant-wide value would put one app's UI into all of them.
        'the artifact of this environment and app (injected per environment and app)': [
            'PRAGMATIC_UI_REGISTRY_BASE', 'PRAGMATIC_UI_REPO', 'PRAGMATIC_UI_ARTIFACT_TAG', 'PRAGMATIC_UI_SIG_TAG', 'PRAGMATIC_UI_MANIFEST_DIGEST', 'PRAGMATIC_UI_APP_NAME', 'PRAGMATIC_UI_APP_VERSION',
        ],
        'the folder it unpacks into (the mount the manifests render)': ['PRAGMATIC_UI_DATA_DIR'],
    }
    public static readonly Undeclared: readonly string[] = Object.values(UiUnpackComponentFixture.PlatformOwned).flat()
}

describe('UiUnpackComponent', () =>
{
    it('pins the descriptor: golden JSON and content digest', () =>
    {
        ComponentGolden.Check(UiUnpackComponent.Descriptor(), UiUnpackComponentFixture.Golden, UiUnpackComponentFixture.Digest)
    })

    it('declares exactly the variables its configuration readers read', () =>
    {
        ComponentSources.AssertCovers(UiUnpackComponent.Descriptor(), UiUnpackComponentFixture.Readers, UiUnpackComponentFixture.Undeclared)
    })

    it('declares no setting: everything it reads is per-environment wiring or the hive trust root', () =>
    {
        assert.deepEqual(UiUnpackComponent.Descriptor().Options.map(o => o.Name), [])
    })

    it('is named for its release image', () =>
    {
        assert.equal(UiUnpackComponent.Descriptor().Name, 'pragmatic-ui-unpack')
    })
})
