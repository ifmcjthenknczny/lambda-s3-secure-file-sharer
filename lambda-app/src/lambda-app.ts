import { createSignedUrl } from './actions/createSignedUrl'
import { finalizeScriptContext, initializeScriptContext } from './context'
import { log } from './helpers/util/log'

export enum ActionType {
    PING = 'PING',
    MIGRATION = 'MIGRATION',
    TEST = 'TEST',
}

interface AppConfig {
    // action: ActionType
    executionId: string
    rawEvent: string | null
    runningLocal: boolean
}

export async function lambda(config: AppConfig) {
    log(`Starting execution: config=${JSON.stringify(config)}.`)
    const context = await initializeScriptContext(config.executionId)

    log({ rawEvent: config.rawEvent })

    await createSignedUrl(config.rawEvent, context)

    await finalizeScriptContext(context)
}
