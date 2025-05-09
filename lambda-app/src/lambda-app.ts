import { createSecretCodes, CreateSecretCodesOptions } from './actions/createSecretCodes'
import { createSignedUrl } from './actions/createSignedUrl'
import { finalizeScriptContext, initializeScriptContext } from './context'
import { log } from './helpers/util/log'
import { createSecretCodesRawEventSchema } from './schema'

export enum ActionType {
    CREATE_SECRET_CODES = 'CREATE_SECRET_CODES'
}

export type RawEvent = CreateSecretCodesOptions | null;

interface AppConfig {
    action: ActionType | null
    executionId: string
    rawEvent: RawEvent | null | any
    runningLocal: boolean
}

export async function lambda(config: AppConfig) {
    log(`Starting execution: config=${JSON.stringify(config)}.`)

    const context = await initializeScriptContext(config.executionId)

    if (config.action === 'CREATE_SECRET_CODES') {
        const options = createSecretCodesRawEventSchema.parse(config.rawEvent) as CreateSecretCodesOptions
        await createSecretCodes(context, options)
        await finalizeScriptContext(context)
        return
    }

    const response = await createSignedUrl(config.rawEvent, context)

    await finalizeScriptContext(context)
    return response
}
