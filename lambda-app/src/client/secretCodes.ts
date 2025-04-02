import { Collection } from 'mongoose'
import { mongo } from './mongo'

const collectionName = 'SecretCodes'

const secretCodeCollection = async () => {
    return (await mongo())!.collection(collectionName) as Collection<
        Document & { _id: string }
    >
}

export const checkAndUseSecretCode = async (code: string) => {
    try {
        const collection = await secretCodeCollection()
        const result = await collection.updateOne(
            { _id: code },
            { $inc: { useCount: 1 } },
        )
        return !!result.modifiedCount
    } catch (error: any) {
        throw new Error(`Failed to check code validity. ${error.message}`)
    }
}
