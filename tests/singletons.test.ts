import assert from 'node:assert/strict'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * The installed tree holds at most one copy of each TODL singleton package: two copies of todl-runtime (or todl, mural)
 * would fail `instanceof` across them. This repository reaches todl-runtime (NodeFsStorage), so it has exactly one.
 */
class InstalledPackages
{
    private static readonly NodeModules = 'node_modules'
    private static readonly PackageJson = 'package.json'
    private static readonly ScopePrefix = '@'
    private static readonly Utf8 = 'utf8'

    /** Every installed package folder's name (nested copies included), one entry per copy. */
    public static Names(root: string): string[]
    {
        const names: string[] = []
        InstalledPackages.Walk(join(root, InstalledPackages.NodeModules), names)
        return names
    }

    private static Walk(modules: string, names: string[]): void
    {
        if (!existsSync(modules))
        {
            return
        }
        for (const entry of readdirSync(modules, { withFileTypes: true }))
        {
            if (!entry.isDirectory() || entry.name.startsWith('.'))
            {
                continue
            }
            const path = join(modules, entry.name)
            if (entry.name.startsWith(InstalledPackages.ScopePrefix))
            {
                InstalledPackages.Walk(path, names)
                continue
            }
            const manifest = join(path, InstalledPackages.PackageJson)
            if (existsSync(manifest))
            {
                names.push((JSON.parse(readFileSync(manifest, InstalledPackages.Utf8)) as { name?: string }).name ?? '')
            }
            InstalledPackages.Walk(join(path, InstalledPackages.NodeModules), names)
        }
    }
}

class SingletonsFixture
{
    public static readonly Root = join(dirname(fileURLToPath(import.meta.url)), '..')
    public static readonly TodlRuntime = '@pragmatic-tech-ai/todl-runtime'
    public static readonly Singletons: readonly string[] = [SingletonsFixture.TodlRuntime, '@pragmatic-tech-ai/todl', '@pragmatic-tech-ai/mural']

    public static CopiesOf(name: string): number
    {
        return InstalledPackages.Names(SingletonsFixture.Root).filter(installed => installed === name).length
    }
}

describe('singletons', () =>
{
    it('one installed copy of todl-runtime', () =>
    {
        assert.equal(SingletonsFixture.CopiesOf(SingletonsFixture.TodlRuntime), 1)
    })

    it('no second copy of todl-runtime, todl or mural', () =>
    {
        for (const name of SingletonsFixture.Singletons)
        {
            assert.ok(SingletonsFixture.CopiesOf(name) <= 1, name)
        }
    })
})
