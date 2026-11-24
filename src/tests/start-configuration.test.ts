import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { AppliedConfiguration, AppliedConfigurationEntries, ComponentStartConfiguration, type IStartProcess } from '@pragmatic-tech-ai/pragmatic-configuration-runtime'
import { UiUnpackComponent } from '../ui-unpack-component.js'

class UnpackStart
{
    public static async InFolder(body: (folder: string) => Promise<void>): Promise<void>
    {
        const folder = await mkdtemp(join(tmpdir(), 'ui-unpack-start-'))
        try
        {
            await body(folder)
        }
        finally
        {
            await rm(folder, { recursive: true, force: true })
        }
    }

    public static Env(path: string): NodeJS.ProcessEnv
    {
        return { PRAGMATIC_CONFIGURATION_FILE: path, PRAGMATIC_UI_REPO: 'apps/crm', PRAGMATIC_UI_DATA_DIR: '/data' }
    }
}

class ExitRecorder implements IStartProcess
{
    public Code: number | undefined
    public readonly stderr = { write: (): boolean => true }

    public exit(code: number): never
    {
        this.Code = code
        throw new Error('exit')
    }
}

describe('the unpacker reads its configuration at start', () =>
{
    it('no configuration starts as before', async () =>
    {
        const env = UnpackStart.Env('/no/such/configuration.json')
        assert.equal((await ComponentStartConfiguration.ApplyOrExit({ Declaration: UiUnpackComponent.Declaration, Env: env })).Applied, false)
        assert.equal(env.PRAGMATIC_UI_REPO, 'apps/crm')
    })

    it('reads the entry prepared for its own descriptor beside a configuration applied for the previous one, and its wiring stays', async () =>
    {
        await UnpackStart.InFolder(async folder =>
        {
            const own = UiUnpackComponent.Descriptor()
            const path = join(folder, 'configuration.json')
            await writeFile(path, new AppliedConfiguration('acme', own.Name, 1, '0.1.1', `sha256:${'1'.repeat(64)}`, { options: {} } as never).ToCanonicalJson())
            const entry = new AppliedConfiguration('acme', own.Name, 2, own.Version, own.ContentDigest(), { options: {} } as never)
            await writeFile(join(folder, AppliedConfigurationEntries.KeyOf(entry.DescriptorDigest)), entry.ToCanonicalJson())
            const env = UnpackStart.Env(path)
            const process = new ExitRecorder()
            assert.equal((await ComponentStartConfiguration.ApplyOrExit({ Declaration: UiUnpackComponent.Declaration, Env: env }, process)).Applied, true)
            assert.equal(process.Code, undefined)
            assert.deepEqual([env.PRAGMATIC_UI_REPO, env.PRAGMATIC_UI_DATA_DIR], ['apps/crm', '/data'])
        })
    })

    it('a configuration that sets its wiring is refused (78), never overlaid', async () =>
    {
        await UnpackStart.InFolder(async folder =>
        {
            const own = UiUnpackComponent.Descriptor()
            const path = join(folder, 'configuration.json')
            await writeFile(path, new AppliedConfiguration('acme', own.Name, 1, own.Version, own.ContentDigest(), { options: { core: { repository: 'apps/other' } } } as never).ToCanonicalJson())
            const env = UnpackStart.Env(path)
            const process = new ExitRecorder()
            await assert.rejects(ComponentStartConfiguration.ApplyOrExit({ Declaration: UiUnpackComponent.Declaration, Env: env }, process))
            assert.equal(process.Code, 78)
            assert.equal(env.PRAGMATIC_UI_REPO, 'apps/crm')
        })
    })
})
