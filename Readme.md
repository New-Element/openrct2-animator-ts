# OpenRCT2 Animator

The goal of the project is to unlock animations and interactions in the game that are otherwise a pain to do by hand - rides, scenery, guests, staff, and the park itself, reacting to each other. Another tool for parkmakers, along with CTRs, object creation, palettes, and the rest.

You set it up in a window inside the game. A trigger starts an animation. An animation is a list of steps. There is a longer explanation in [docs/guide.md](docs/guide.md).

## Install

1. Download the latest .js file from the [Releases](https://github.com/new-element/openrct2-animator-ts/releases) page.
2. In OpenRCT2, click and hold the red toolbox button.
3. Choose Open Custom Content Folder.
4. Open the plugin folder inside that directory.
5. Paste (or overwrite) the .js file there.
6. Restart OpenRCT2 or reload the park so the new plugin loads.

## Open The Window

Click the map icon, then Animator. The default shortcut is A. Shortcuts can be changed under Options, Shortcut Keys. Animator's shortcuts are grouped together there.

The tabs are Triggers, Animations, Variables, Logs, Look Inside, To-Dos, and Info. Each tab has a Help button.

## Saving

Animator keeps its data in the park. The next time you save the game, triggers, animations, variables, Look Inside buildings, and to-dos are saved with it. If an animation is part way through when you save, that progress is saved too.

To run any of this on a later load, the plugin has to be installed. Make sure the park still works for anyone who does not have it. If the park was last saved with a newer Animator than the one installed, the plugin will say so.

## Building From Source

You need Node.js.

```
npm install
npm run build-release
```

That writes `build/openrct2-animator-<version>.js`. Copy that file into the OpenRCT2 plugin folder the same way as a release.

`npm run build-develop` writes a develop build straight into a plugin folder. The path is set in `rollup.config.develop.js`. Change it if that path is not your machine.

`npm run watch` rebuilds that develop file when the source changes.

The licence is GPL-3.0. See `license.txt`.
