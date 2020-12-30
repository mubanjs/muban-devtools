# Open component in editor

## Webpack

In your Muban project, install the [launch-editor-middleware](https://github.com/yyx990803/launch-editor#middleware) 
package and modify your webpack configuration:

1. Import the package:

```js
var openInEditor = require('launch-editor-middleware')
```

2. In the `devServer` option, register the `/__open-in-editor` HTTP route:

```js
devServer: {
  before (app) {
    app.use('/__open-in-editor', openInEditor())
  }
}
```

3. The editor to launch is guessed. You can also specify the editor app with the `editor` option. See the [supported editors list](https://github.com/yyx990803/launch-editor#supported-editors).

```js
openInEditor('code')
```

4. You can now click on the name of the component in the Component inspector pane (if the devtools knows about its file source, a tooltip will appear).

## Node.js

You can use the [launch-editor](https://github.com/yyx990803/launch-editor#usage) package to setup an HTTP route with the `/__open-in-editor` path. It will receive `file` as an URL variable.

## Customize request

You can change the request host (default `/`) with the following code in your frontend app:

```js
if (process.env.NODE_ENV !== 'production')
  // App served from port 4000
  // Webpack dev server on port 9000
  window.MUBAN_DEVTOOLS_CONFIG = {
    openInEditorHost: 'http://localhost:9000/'
  }
}
```
