import mongoose, { Collection } from 'mongoose'
import { CreateSecretCodesOptions } from '../actions/createSecretCodes'
import dayjs from 'dayjs'
import { DisableSecretCodesOptions } from '../actions/disableSecretCodes'

const collectionName = 'SecretCodes'

export type SecretCode = {
    _id: string
    fileName: string
    createdAt: Date
    expiresAt: Date
    useLimit: number
    useCount: number
    tag?: string[]
    manuallyDisabled: boolean
}

export type InsertSecretCodeParameters = Omit<
    CreateSecretCodesOptions,
    'count'
> & { _id: string }

const secretCodeCollection = (db: mongoose.mongo.Db) => {
    return db.collection(collectionName) as Collection<SecretCode>
}

export const findSecretCode = async (db: mongoose.mongo.Db, code: string) => {
    try {
        const collection = secretCodeCollection(db)
        const result = await collection.findOne({ _id: code })
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

export const insertSecretCode = async (
    db: mongoose.mongo.Db,
    { _id, fileName, daysValid, useLimit, tag }: InsertSecretCodeParameters,
) => {
    try {
        const collection = secretCodeCollection(db)
        await collection.insertOne({
            _id,
            fileName,
            createdAt: dayjs().toDate(),
            expiresAt: dayjs().add(daysValid, 'days').toDate(),
            ...(tag && { tag }),
            ...(useLimit && { useLimit }),
            manuallyDisabled: false,
        } as SecretCode)
    } catch (error: any) {
        throw new Error(`Failed to insert code. ${error.message}`)
    }
}

const buildDisableCodeFilter = (codes?: string[], tags?: string[]) => {
    const or: Record<string, any>[] = []

    if (codes?.length) {
        or.push({ _id: { $in: codes } })
    }

    if (tags?.length) {
        or.push({ tag: { $in: tags } })
    }

    return or.length ? { $or: or } : null
}

export const manuallyDisableSecretCodes = async (
    db: mongoose.mongo.Db,
    { codes, tags }: DisableSecretCodesOptions,
) => {
    try {
        const collection = secretCodeCollection(db)
        const filter = buildDisableCodeFilter(codes, tags)

        if (!filter) {
            return
        }

        const result = await collection.updateMany(filter, {
            $set: { manuallyDisabled: true },
        })
        return result
    } catch (error: any) {
        throw new Error(`Failed to disable codes. ${error.message}`)
    }
}
