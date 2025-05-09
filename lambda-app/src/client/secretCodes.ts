import { Collection } from 'mongoose'
import { mongo } from './mongo'
import { CreateSecretCodesOptions } from '../actions/createSecretCodes'

const collectionName = 'SecretCodes'

export type SecretCode = {
    _id: string
    fileName: string
    createdAt: Date
    expiresAt: Date
}

export type InsertSecretCodeParameters = Omit<
    CreateSecretCodesOptions,
    'count'
> & { _id: string }

const secretCodeCollection = async () => {
    return (await mongo())!.collection(collectionName) as Collection<
        SecretCode
    >
}

export const findSecretCode = async (code: string) => {
try {
        const collection = await secretCodeCollection()
        const result = await collection.findOne(
            { _id: code },
        )
        return result
    } catch (error: any) {
        throw new Error(`Failed to get code. ${error.message}`)
    }
}

export const useSecretCode = async (code: string) => {
    try {
        const collection = await secretCodeCollection()
        const result = await collection.updateOne(
            { _id: code },
            { $inc: { useCount: 1 } },
        )
        return !!result.modifiedCount
    } catch (error: any) {
        throw new Error(`Failed to use code. ${error.message}`)
    }
}

export const insertSecretCode = async ({
    _id,
    fileName,
    expiresAt,
}: InsertSecretCodeParameters) => {
    try {
        const collection = await secretCodeCollection()
        await collection.insertOne({
            _id,
            fileName,
            createdAt: new Date(),
            expiresAt: new Date(expiresAt),
        } as SecretCode)
    } catch (error: any) {
        throw new Error(`Failed to check code validity. ${error.message}`)
    }
}
