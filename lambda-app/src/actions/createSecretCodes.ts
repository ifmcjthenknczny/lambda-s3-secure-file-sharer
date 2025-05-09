import { log } from '../helpers/util/log'
import {v4 as uuid} from 'uuid'
import { chunkify, range } from '../helpers/util/array'
import { insertSecretCode, InsertSecretCodeParameters } from '../client/secretCodes'

type Day = `${number}-${number}-${number}`
export type CreateSecretCodesOptions = {
    expiresAt: Day
    fileName: string
    count: number
}

export const createSecretCodes = async (options: CreateSecretCodesOptions) => {
    const codes: Omit<InsertSecretCodeParameters, 'createdAt'>[] = []

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const _ of range(0, options.count)) {
        codes.push({
            _id: uuid(),
            expiresAt: options.expiresAt,
            fileName: options.fileName
        })
    }

    const CHUNK_SIZE = 10

    const chunkifiedJobs = chunkify(codes.map((code => insertSecretCode(code))) , CHUNK_SIZE)

    for (const chunk of chunkifiedJobs) {
        await Promise.all(chunk)
    }

    log(`SUCCESSFULLY INSERTED ${options.count} CODES FOR ${options.fileName}`)
}
