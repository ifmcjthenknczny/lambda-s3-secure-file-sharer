import mongoose from 'mongoose'

const collectionName = 'UserLogs'

const userLogCollection = (db: mongoose.mongo.Db) => {
    return db.collection(collectionName)
}

export const insertUserLog = async (
    db: mongoose.mongo.Db,
    userLog: Record<string, any>,
) => {
    try {
        const collection = userLogCollection(db)
        const id = await collection.insertOne(userLog)
        return id
    } catch (error: any) {
        throw new Error(`Failed to insert user log. ${error.message}`)
    }
}
