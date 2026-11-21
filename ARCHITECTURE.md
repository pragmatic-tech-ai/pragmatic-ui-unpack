# pragmatic-ui-unpack architecture

One container, one job: reconcile a data folder to one signed UI artifact.

| File | Role |
|---|---|
| `src/bin/pragmatic-ui-unpack.ts` | `UiUnpackBin`: the entry. Reads the environment, builds the unpacker, exits 1 on any failure. |
| `src/ui-unpacker.ts` | `UiUnpacker.Reconcile`: digest pin, signature check, full validation, then the writes; the live pointer last (the commit point). A current version already unpacked is a no-op. Packages of the previous live (or legacy) `application.json` are carried forward. |
| `src/ui-unpack-component.ts` | `UiUnpackComponent`: the component descriptor (no port, no storage). |
| `src/release-components.ts` | `Components`: the descriptor source the image build reads (`pragmatic-component-descriptors --components dist/release-components.js`). |
| `closure.json` | What the image copies; `pragmatic-closure-check` keeps it, the Dockerfile and the code in step. |

Dependencies: `pragmatic-release-toolkit` (`OciRegistryClient`, `UiArtifact`, `UiArtifactVerifier`, `FileKeyStore`),
`pragmatic-component` (the descriptor) and `todl-runtime` (`NodeFsStorage`, the `IStorage` the tree is written through).

Tests: `src/tests` (the unpacker against a canned registry, the descriptor golden and its readers), `tests/` (the
release module's descriptor equals the pragmatic-server golden digest; one installed copy of todl-runtime).
