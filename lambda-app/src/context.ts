import dotenv from 'dotenv'
import { log } from './helpers/util/log'
import { mongo } from './client/mongo'
import mongoose from 'mongoose'
import { S3 } from 'aws-sdk'

dotenv.config()

export type ScriptContext = {
    executionId: string
    now: Date
    db: mongoose.mongo.Db
    s3: S3
}

export async function initializeScriptContext(
    executionId: string,
): Promise<ScriptContext> {
    log(`Initializing script context: executionId=${executionId}.`)

    const now = new Date()
    const db = await mongo()
    const s3 = new S3()

    log('Script context initialized.')
    return {
        executionId,
        now,
        db,
        s3,
    }
}

export async function finalizeScriptContext(context: ScriptContext) {
    log(`Finalizing script context: executionId=${context.executionId}.`)

    await mongoose.connection.close()

    log('Script context finalized.')
    // process.exit(0);
}
