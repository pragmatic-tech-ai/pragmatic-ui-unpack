import { type ComponentDescriptor, ComponentDeclarations, type ComponentDeclaration } from '@pragmatic-tech-ai/pragmatic-component'

/**
 * The component descriptor of the UI-unpack init container (bin/pragmatic-ui-unpack). It pulls, verifies and unpacks one
 * signed UI artifact, then exits: no port, no storage of its own.
 *
 * It declares no setting: every variable it reads is deployment wiring the manifests inject per environment and per app
 * (the registry, the artifact, its signature and manifest digest, the app and its version, the folder it unpacks into) or
 * the hive's root of trust, so no tenant configuration (one per realm, applied to every environment) can set them (C3.1
 * Ledger, platform-owned settings). The start step still runs first, so a later tenant setting reads without a new image.
 */
export class UiUnpackComponent
{
    public static readonly Name = 'pragmatic-ui-unpack'
    /** The descriptor version: this application's package version (the release test pins it to package.json). */
    public static readonly Version = '0.1.2'

    /** The declaration: the descriptor (no option), and nothing for the start step to overlay. */
    public static readonly Declaration: ComponentDeclaration = {
        name: UiUnpackComponent.Name,
        version: UiUnpackComponent.Version,
        options: [],
        roles: [],
        postgres: false,
        ports: [],
    }

    public static Descriptor(): ComponentDescriptor
    {
        return ComponentDeclarations.Build(UiUnpackComponent.Declaration)
    }
}
