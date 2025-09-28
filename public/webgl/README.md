# Dakota WebGL Avatar Build Placeholder

Drop the exported Unity WebGL build for the avatar into this folder. The loader in `public/index.html` expects the following structure:

```
public/webgl/
  Build/
    AvatarBuild.data
    AvatarBuild.framework.js
    AvatarBuild.loader.js
    AvatarBuild.wasm
  TemplateData/
    ... (optional Unity template assets)
```

## How to update the build
1. Open the minimal Unity project inside `VirtualDakota/`.
2. Ensure `AvatarScene.unity` is the only scene in the WebGL build settings.
3. Build for WebGL, targeting this directory (you can build elsewhere and copy the `Build/` and `TemplateData/` folders here).
4. The web app will automatically load the build on page load and expose it via `window.unityInstance`.

> **Tip:** These files are ignored by git (see `.gitignore`) to keep large binaries out of the repository. If you need to distribute a build to collaborators, share it via a release archive instead of committing the binaries.
