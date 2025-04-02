import { mongo } from './mongo'

const collectionName = 'UserLogs'

const userLogCollection = async () => {
    return (await mongo())!.collection(collectionName)
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
