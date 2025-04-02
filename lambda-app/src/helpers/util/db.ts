import { Collection, Document } from 'mongodb'

export const findNextId = async (
    collection: Collection<Document & { _id: number }>,
): Promise<number> => {
    const lastDoc = await collection.find().sort({ _id: -1 }).limit(1).next()
    return lastDoc ? lastDoc._id + 1 : 1
}
