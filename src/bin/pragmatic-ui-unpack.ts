import { NodeFsStorage } from '@pragmatic-tech-ai/todl-runtime/node'
import { FileKeyStore, OciRegistryClient, UiArtifactVerifier } from '@pragmatic-tech-ai/pragmatic-release-toolkit'
import { UiUnpackError, UiUnpacker, type UiUnpackInput } from '../ui-unpacker.js'

/** A required environment variable is missing or empty: a configuration refusal, naming the variable (never a value). */
export class UiUnpackConfigError extends Error
{
    private static readonly ErrorName = 'UiUnpackConfigError'
    private static readonly RequiredSuffix = ' is required'

    public constructor(public readonly Variable: string)
    {
        super(Variable + UiUnpackConfigError.RequiredSuffix)
        this.name = UiUnpackConfigError.ErrorName
    }
}

/**
 * Init-container entry: reads its inputs from the environment, reconciles, and exits non-zero on any failure. Each
 * failure kind prints its own fixed line, so a configuration refusal (`<variable> is required`) is told apart from an
 * unpack failure and from an unexpected error.
 */
export class UiUnpackBin
{
    public static readonly RegistryPullBaseEnv = 'PRAGMATIC_UI_REGISTRY_BASE'
    public static readonly RepoEnv = 'PRAGMATIC_UI_REPO'
    public static readonly ArtifactTagEnv = 'PRAGMATIC_UI_ARTIFACT_TAG'
    public static readonly SigTagEnv = 'PRAGMATIC_UI_SIG_TAG'
    public static readonly ExpectedDigestEnv = 'PRAGMATIC_UI_MANIFEST_DIGEST'
    public static readonly AppNameEnv = 'PRAGMATIC_UI_APP_NAME'
    public static readonly AppVersionEnv = 'PRAGMATIC_UI_APP_VERSION'
    public static readonly TrustRootRefEnv = 'PRAGMATIC_UI_TRUST_ROOT_REF'
    public static readonly DataDirEnv = 'PRAGMATIC_UI_DATA_DIR'
    public static readonly TrustDirEnv = 'PRAGMATIC_UI_TRUST_DIR'
    private static readonly Prefix = 'pragmatic-ui-unpack: '
    private static readonly UnexpectedMessage = 'failed (unexpected error)'

    public static async Main(env: NodeJS.ProcessEnv = process.env): Promise<void>
    {
        const S = UiUnpackBin
        try
        {
            const base = S.Required(env, S.RegistryPullBaseEnv)
            const dataDir = S.Required(env, S.DataDirEnv)
            const trustDir = S.Required(env, S.TrustDirEnv)
            const input: UiUnpackInput =
            {
                repo: S.Required(env, S.RepoEnv),
                artifactTag: S.Required(env, S.ArtifactTagEnv),
                sigTag: S.Required(env, S.SigTagEnv),
                expectedManifestDigest: S.Required(env, S.ExpectedDigestEnv),
                appName: S.Required(env, S.AppNameEnv),
                appVersion: S.Required(env, S.AppVersionEnv),
                trustRootRef: S.Required(env, S.TrustRootRefEnv),
            }
            const unpacker = new UiUnpacker(new OciRegistryClient(base), new UiArtifactVerifier(new FileKeyStore(trustDir)), new NodeFsStorage(dataDir))
            await unpacker.Reconcile(input)
        }
        catch (error)
        {
            console.error(S.Prefix + S.Describe(error))
            process.exitCode = 1
        }
    }

    /** The failure's fixed, material-free line: the missing variable's name, the unpacker's safe message, or neither. */
    private static Describe(error: unknown): string
    {
        if (error instanceof UiUnpackConfigError || error instanceof UiUnpackError)
        {
            return error.message
        }
        return UiUnpackBin.UnexpectedMessage
    }

    private static Required(env: NodeJS.ProcessEnv, name: string): string
    {
        const value = env[name]
        if (value === undefined || value.length === 0)
        {
            throw new UiUnpackConfigError(name)
        }
        return value
    }
}

await UiUnpackBin.Main()
