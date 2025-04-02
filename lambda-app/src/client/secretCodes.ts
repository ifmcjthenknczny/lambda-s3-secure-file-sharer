import { Collection } from 'mongoose'
import mongoose from 'mongoose'

const collectionName = 'SecretCodes'

const secretCodeCollection = async (db: mongoose.mongo.Db) => {
    return db!.collection(collectionName) as Collection<
        Document & { _id: string }
    >
}

export const checkAndUseSecretCode = async (
    db: mongoose.mongo.Db,
    code: string,
) => {
    try {
        const collection = await secretCodeCollection(db)
        const result = await collection.updateOne(
            { _id: code },
            { $inc: { useCount: 1 } },
        )
        return !!result.modifiedCount
    } catch (error: any) {
        throw new Error(`Failed to check code validity. ${error.message}`)
    }
}
