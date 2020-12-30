# muban-devtools

<p align="center"><img width="720px" src="https://raw.githubusercontent.com/mubanjs/muban-devtools/main/media/screenshot.jpg" alt="screenshot"></p>

> This extension is forked from [Vue 3 devtools beta](https://github.com/vuejs/vue-devtools/tree/next) - an amazing 
> peace of software! Muban makes use of the same Reactivity API from Vue, so a lot of the features in devtools are 
> usable as-is.

## Installation

> Until the Chrome extension is approved and available on the store, you have to install it manually 

Build the .zip file from this project, or download from this [Google Drive](https://drive.google.com/file/d/1VTcld-FbvcLwHhs3R1uwTY1H_wrL1Dx-/view?usp=sharing)

- Open the Chrome extension page (currently under Menu > More Tools > Extensions),
  or [chrome://extensions/](chrome://extensions/).
- Enable the "Developer mode" toggle on the top right
- Click "Load unpacked" at the top left, and select the zip file

### Important Usage Notes

To make it work for pages opened via `file://` protocol, you need to check "Allow access to file URLs" for this 
extension in Chrome's extension management panel.


### Open component in editor

To enable this feature, follow [this guide](./docs/open-in-editor.md).

### Manual Installation

This is only necessary when you want to build the extension yourself from source to get not-yet-released features.

**Make sure you are using Node 6+ and Yarn**

1. Clone this repo
2. `cd muban-devtools` the newly created folder
3. run `yarn`
4. then run `yarn build`
5. Open the Chrome extension page (currently under Menu > More Tools > Extensions)
6. Check "developer mode" on the top-right corner
7. Click the "load unpacked" button on the left, and choose the folder: `muban-devtools/packages/shell-chrome/`
8. Alternatively to step 3, you can also use `yarn dev:chrome` to build & watch the unpacked extension

### Development

```bash
# Clone repo
git clone git@github.com:mubanjs/muban-devtools.git

# Change into devtools directory
cd muban-devtools

# Checkout next branch
git checkout next

# Install dependencies
yarn

# Build TypeScript dependencies
yarn build:watch

# Start local environment
yarn dev:shell-muban
```

Once everything is setup, you should be able to visit http://localhost:8090/

### Common problems and how to fix

1. Fixing "Download the Muaban Devtools for a better development experience" console message when working locally over 
   `file://` protocol:
   
   1.1 - Google Chrome: Right click on muban-devtools icon and click "Manage Extensions" then search for 
   muban-devtools on the extensions list. Check the "Allow access to file URLs" box.

### License

[MIT](http://opensource.org/licenses/MIT)
