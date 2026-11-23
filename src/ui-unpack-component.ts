import { SettingType, type ComponentDescriptor, ComponentDeclarations, type ComponentDeclaration } from '@pragmatic-tech-ai/pragmatic-component'

/**
 * The component descriptor of the UI-unpack init container (bin/pragmatic-ui-unpack): every variable it reads is required.
 * It pulls, verifies and unpacks one signed UI artifact, then exits: no port, no storage of its own.
 */
export class UiUnpackComponent
{
    public static readonly Name = 'pragmatic-ui-unpack'
    /** The descriptor version: this application's package version (the release test pins it to package.json). */
    public static readonly Version = '0.1.1'

    /** The declaration: the descriptor, and the variable the start step overlays each configured setting onto. */
    public static readonly Declaration: ComponentDeclaration = {
        name: UiUnpackComponent.Name,
        version: UiUnpackComponent.Version,
        options: [
            {
                name: 'core',
                description: 'The UI artifact to unpack and the trust it is verified against.',
                settings: [
                    { name: 'registryBase', type: SettingType.Url, source: 'PRAGMATIC_UI_REGISTRY_BASE', required: true, description: 'Base URL of the registry the artifact is pulled from.' },
                    { name: 'repository', type: SettingType.String, source: 'PRAGMATIC_UI_REPO', required: true, description: 'The artifact repository.' },
                    { name: 'artifactTag', type: SettingType.String, source: 'PRAGMATIC_UI_ARTIFACT_TAG', required: true, description: 'The artifact tag.' },
                    { name: 'signatureTag', type: SettingType.String, source: 'PRAGMATIC_UI_SIG_TAG', required: true, description: 'The tag of the artifact signature.' },
                    { name: 'manifestDigest', type: SettingType.String, source: 'PRAGMATIC_UI_MANIFEST_DIGEST', required: true, description: 'The manifest digest the artifact must have.' },
                    { name: 'appName', type: SettingType.String, source: 'PRAGMATIC_UI_APP_NAME', required: true, description: 'The application the UI belongs to.' },
                    { name: 'appVersion', type: SettingType.String, source: 'PRAGMATIC_UI_APP_VERSION', required: true, description: 'The application version.' },
                    { name: 'dataDir', type: SettingType.String, source: 'PRAGMATIC_UI_DATA_DIR', required: true, description: 'Folder the UI is unpacked into.' },
                ],
            },
        ],
        roles: [],
        postgres: false,
        ports: [],
    }

    public static Descriptor(): ComponentDescriptor
    {
        return ComponentDeclarations.Build(UiUnpackComponent.Declaration)
    }
}
