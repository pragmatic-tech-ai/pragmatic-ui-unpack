import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Runs the init-container entry with a chosen environment (no PRAGMATIC_UI_* inherited) and reads how it ended. */
class UiUnpackBinFixture
{
    public static readonly Here = dirname(fileURLToPath(import.meta.url))
    public static readonly Bin = join(UiUnpackBinFixture.Here, '..', 'pragmatic-ui-unpack.ts')
    public static readonly TsxCli = join(UiUnpackBinFixture.Here, '..', '..', '..', 'node_modules', 'tsx', 'dist', 'cli.mjs')
    public static readonly OwnPrefix = 'PRAGMATIC_UI_'
    public static readonly Utf8 = 'utf8'
    public static readonly TimeoutMs = 60_000
    public static readonly RegistryBaseRefusal = 'pragmatic-ui-unpack: PRAGMATIC_UI_REGISTRY_BASE is required'
    public static readonly RepoRefusal = 'pragmatic-ui-unpack: PRAGMATIC_UI_REPO is required'
    public static readonly OldGenericLine = 'pragmatic-ui-unpack: failed'
    public static readonly FirstThree: Readonly<Record<string, string>> =
    {
        PRAGMATIC_UI_REGISTRY_BASE: 'http://127.0.0.1:9/v2',
        PRAGMATIC_UI_DATA_DIR: 'unused-data',
        PRAGMATIC_UI_TRUST_DIR: 'unused-trust',
    }

    public static Run(own: Readonly<Record<string, string>>): { Code: number | null; Stderr: string }
    {
        const F = UiUnpackBinFixture
        const env: NodeJS.ProcessEnv = {}
        for (const [name, value] of Object.entries(process.env))
        {
            if (!name.startsWith(F.OwnPrefix))
            {
                env[name] = value
            }
        }
        const result = spawnSync(process.execPath, [F.TsxCli, F.Bin], { env: { ...env, ...own }, encoding: F.Utf8, timeout: F.TimeoutMs })
        return { Code: result.status, Stderr: result.stderr }
    }
}

describe('pragmatic-ui-unpack entry', () =>
{
    it('refuses a missing registry base by name and exits non-zero', () =>
    {
        const result = UiUnpackBinFixture.Run({})
        assert.equal(result.Code, 1)
        assert.ok(result.Stderr.includes(UiUnpackBinFixture.RegistryBaseRefusal), result.Stderr)
        assert.ok(!result.Stderr.includes(UiUnpackBinFixture.OldGenericLine), result.Stderr)
    })

    it('names the first missing variable after the ones that are set', () =>
    {
        const result = UiUnpackBinFixture.Run(UiUnpackBinFixture.FirstThree)
        assert.equal(result.Code, 1)
        assert.ok(result.Stderr.includes(UiUnpackBinFixture.RepoRefusal), result.Stderr)
    })
})
