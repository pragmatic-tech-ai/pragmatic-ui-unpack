import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { SettingType } from '@pragmatic-tech-ai/pragmatic-component'
import { AppliedConfiguration } from '@pragmatic-tech-ai/pragmatic-configuration-runtime'
import { UiUnpackComponent } from '../../ui-unpack-component.js'
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

    public static readonly Core: Readonly<Record<string, string>> =
    {
        registryBase: 'http://127.0.0.1:9/v2', repository: 'apps/crm', artifactTag: 'v1', signatureTag: 'v1.sig', manifestDigest: 'sha256:' + 'a'.repeat(64),
        appName: 'crm', appVersion: '1.0.0', dataDir: 'unused-data',
    }

    /** Runs `body` with a mounted configuration file holding `core`. */
    public static WithConfiguration(core: Readonly<Record<string, unknown>>, body: (path: string) => void): void
    {
        const folder = mkdtempSync(join(tmpdir(), 'ui-unpack-start-'))
        try
        {
            const d = UiUnpackComponent.Descriptor()
            const path = join(folder, 'configuration.json')
            writeFileSync(path, new AppliedConfiguration('acme', d.Name, 1, d.Version, d.ContentDigest(), { options: { core } } as never).ToCanonicalJson())
            body(path)
        }
        finally
        {
            rmSync(folder, { recursive: true, force: true })
        }
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

    it('a mounted configuration overrides the declared variables before the settings are read', () =>
    {
        UiUnpackBinFixture.WithConfiguration(UiUnpackBinFixture.Core, path =>
        {
            const result = UiUnpackBinFixture.Run({ PRAGMATIC_CONFIGURATION_FILE: path, PRAGMATIC_UI_TRUST_ROOT_REF: 'root', PRAGMATIC_UI_TRUST_DIR: 'unused-trust' })
            assert.equal(result.Code, 1, 'the configured registry is unreachable, so the unpack itself fails')
            assert.ok(!result.Stderr.includes('is required'), result.Stderr)
        })
    })

    it('an invalid configuration exits with the start error code 78 and the reason', () =>
    {
        UiUnpackBinFixture.WithConfiguration({ ...UiUnpackBinFixture.Core, registryBase: 'not a url' }, path =>
        {
            const result = UiUnpackBinFixture.Run({ PRAGMATIC_CONFIGURATION_FILE: path })
            assert.equal(result.Code, 78)
            assert.match(result.Stderr, /pragmatic-ui-unpack: cannot start on the applied configuration: .*\(invalid\)/)
        })
    })

    it('the root of trust is not configurable by the tenant', () =>
    {
        UiUnpackBinFixture.WithConfiguration({ ...UiUnpackBinFixture.Core, trustDir: '/attacker' }, path =>
        {
            assert.equal(UiUnpackBinFixture.Run({ PRAGMATIC_CONFIGURATION_FILE: path }).Code, 78)
        })
    })

    it('no configuration starts as before; the unpacker declares no list setting', () =>
    {
        assert.equal(UiUnpackBinFixture.Run({ PRAGMATIC_CONFIGURATION_FILE: join(tmpdir(), 'absent-configuration.json') }).Code, 1)
        assert.deepEqual(UiUnpackComponent.Descriptor().Options.flatMap(o => o.Settings).filter(s => s.Type === SettingType.List), [])
    })

    it('names the first missing variable after the ones that are set', () =>
    {
        const result = UiUnpackBinFixture.Run(UiUnpackBinFixture.FirstThree)
        assert.equal(result.Code, 1)
        assert.ok(result.Stderr.includes(UiUnpackBinFixture.RepoRefusal), result.Stderr)
    })
})
