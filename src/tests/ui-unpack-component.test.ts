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
    public static readonly Digest = 'sha256:85609c520dedaec1df8334e86030281fa4d9a8b355b60dde2ef0db8a16f43d5b'
    public static readonly Readers = [['..', 'bin', 'pragmatic-ui-unpack.ts']].map(path => join(UiUnpackComponentFixture.Here, ...path))
    /** Platform-owned: the hive's root of trust the artifact signature must chain to, never tenant-configurable. */
    public static readonly Undeclared: readonly string[] = ['PRAGMATIC_UI_TRUST_ROOT_REF', 'PRAGMATIC_UI_TRUST_DIR']
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

    it('is named for its release image', () =>
    {
        assert.equal(UiUnpackComponent.Descriptor().Name, 'pragmatic-ui-unpack')
    })
})
