import dotenv from 'dotenv'
import { log } from './helpers/util/log'
import mongoose from 'mongoose'
import { mongo } from './client/mongo'

dotenv.config()

export type ScriptContext = {
    executionId: string
    now: Date
    db: mongoose.mongo.Db
}

export async function initializeScriptContext(
    executionId: string,
): Promise<ScriptContext> {
    log(`Initializing script context: executionId=${executionId}.`)

    const now = new Date()
    const db = await mongo()

    log('Script context initialized.')
    return {
        db,
        executionId,
        now,
    }
}

export async function finalizeScriptContext(context: ScriptContext) {
    log(`Finalizing script context: executionId=${context.executionId}.`)

    await mongoose.connection.close()

    log('Script context finalized.')
    // process.exit(0);
}
