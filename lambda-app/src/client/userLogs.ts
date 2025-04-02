import { mongo } from './mongo'

const collectionName = 'UserLogs'

const userLogCollection = async () => {
    const db = await mongo()
    return db.collection(collectionName)
}

export const insertUserLog = async (userLog: Record<string, any>) => {
    try {
        const collection = await userLogCollection()
        const id = await collection.insertOne(userLog)
        return id
    } catch (error: any) {
        throw new Error(`Failed to insert user log. ${error.message}`)
    }
}
