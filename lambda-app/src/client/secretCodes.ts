import mongoose, { Collection } from 'mongoose'
import { CreateSecretCodesOptions } from '../actions/createSecretCodes'
import dayjs from 'dayjs'

const collectionName = 'SecretCodes'

export type SecretCode = {
    _id: string
    fileName: string
    createdAt: Date
    expiresAt: Date
    useLimit: number
    useCount: number
}

export type InsertSecretCodeParameters = Omit<
    CreateSecretCodesOptions,
    'count'
> & { _id: string }

const secretCodeCollection = (db: mongoose.mongo.Db) => {
    return db.collection(collectionName) as Collection<
        SecretCode
    >
}

export const findSecretCode = async (db: mongoose.mongo.Db, code: string) => {
try {
        const collection = secretCodeCollection(db)
        const result = await collection.findOne(
            { _id: code },
        )
        return result
    } catch (error: any) {
        throw new Error(`Failed to get code. ${error.message}`)
    }
}

export const useSecretCode = async (db: mongoose.mongo.Db, code: string) => {
    try {
        const collection = secretCodeCollection(db)
        const result = await collection.updateOne(
            { _id: code },
            { $inc: { useCount: 1 } },
        )
        return !!result.modifiedCount
    } catch (error: any) {
        throw new Error(`Failed to use code. ${error.message}`)
    }
}

export const insertSecretCode = async (db: mongoose.mongo.Db, {
    _id,
    fileName,
    daysValid,
    useLimit
}: InsertSecretCodeParameters) => {
    try {
        const collection = secretCodeCollection(db)
        await collection.insertOne({
            _id,
            fileName,
            createdAt: dayjs().toDate(),
            expiresAt: dayjs().add(daysValid, 'days').toDate(),
            ...(useLimit && {useLimit})
        } as SecretCode)
    } catch (error: any) {
        throw new Error(`Failed to insert code validity. ${error.message}`)
    }
}
