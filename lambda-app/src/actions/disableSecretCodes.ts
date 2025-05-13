import { disableSecretCodesSchema } from './../schema'
import { log } from '../helpers/util/log'
import { manuallyDisableSecretCodes } from '../client/secretCodes'
import { ScriptContext } from '../context'
import { RawEvent } from '../lambda-app'
import { AtLeastOne } from '../types'

export type DisableSecretCodesOptions = AtLeastOne<{
    codes: string[]
    tags: string[]
}>

export const disableSecretCodes = async (
    { db }: ScriptContext,
    event: RawEvent,
) => {
    const options = disableSecretCodesSchema.parse(
        event,
    ) as DisableSecretCodesOptions

    const result = await manuallyDisableSecretCodes(db, options)

    log(`SUCCESSFULLY DISABLED ${result?.modifiedCount} CODES`)
}
