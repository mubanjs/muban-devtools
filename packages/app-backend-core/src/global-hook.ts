import { DevtoolsHook } from '@muban-devtools/app-backend-api'
import { target } from '@muban-devtools/shared-utils'

// hook should have been injected before this executes.
export const hook: DevtoolsHook = target.__MUBAN_DEVTOOLS_GLOBAL_HOOK__
