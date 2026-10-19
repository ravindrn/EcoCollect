import { createElement } from 'react'
import { registerRootComponent } from 'expo'
import { AppErrorBoundary } from './src/components/AppErrorBoundary'

import App from './App'

function Root() {
    return createElement(AppErrorBoundary, null, createElement(App))
}

registerRootComponent(Root)
