import { log } from '../helpers/util/log'
import {v4 as uuid} from 'uuid'
import { chunkify, range } from '../helpers/util/array'
import { insertSecretCode, InsertSecretCodeParameters } from '../client/secretCodes'
import { ScriptContext } from '../context'

export type CreateSecretCodesOptions = {
    daysValid: number
    fileName: string
    count: number
    useLimit?: number
}

export const createSecretCodes = async ({db}: ScriptContext, options: CreateSecretCodesOptions) => {
    const codes: Omit<InsertSecretCodeParameters, 'createdAt'>[] = []

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of range(0, options.count)) {
        codes.push({
            _id: uuid(),
            daysValid: options.daysValid,
            fileName: options.fileName,
            ...(options.useLimit && {useLimit: options.useLimit})
        })
}

    const CHUNK_SIZE = 10

    const chunkifiedJobs = chunkify(codes.map((code => insertSecretCode(db, code))) , CHUNK_SIZE)

    for (const chunk of chunkifiedJobs) {
        await Promise.all(chunk)
    }

    log(`SUCCESSFULLY INSERTED ${options.count} CODES FOR ${options.fileName}`)
}
