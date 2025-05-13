import { logError } from '../helpers/util/log'
import { ScriptContext } from '../context'
import { insertUserLog } from '../client/userLogs'
import {
    findSecretCode,
    SecretCode,
    useSecretCode,
} from '../client/secretCodes'
import { S3 } from 'aws-sdk'
import { omit } from '../helpers/util/object'
import dayjs from 'dayjs'
import mongoose from 'mongoose'

const BUCKET_NAME = process.env.BUCKET_NAME as string

interface LambdaResponse {
    statusCode: number
    body: string | null
    headers?: { [key: string]: string | number | boolean }
}

type InvalidResponse = { isValid: false; errorResponse: LambdaResponse }

type CodeValidationResult =
    | { isValid: true; dbCode: SecretCode }
    | InvalidResponse

const invalidResponse = (message?: string): InvalidResponse => {
    return {
        isValid: false,
        errorResponse: {
            statusCode: 403,
            body: JSON.stringify({ message: message || 'Code is invalid.' }),
        },
    }
}

async function validateSecretCode(
    code: string | undefined,
    db: mongoose.mongo.Db,
    now: Date,
): Promise<CodeValidationResult> {
    if (!code) {
        return invalidResponse('Code is required.')
    }

    const dbCode = await findSecretCode(db, code)

    if (!dbCode) {
        return invalidResponse()
    }

    if (dbCode.manuallyDisabled) {
        return invalidResponse('Code is disabled.')
    }

    if (dayjs(now).isAfter(dayjs(dbCode.expiresAt))) {
        return invalidResponse('Code has expired.')
    }

    if (
        typeof dbCode.useLimit === 'number' &&
        (dbCode.useCount || 0) >= dbCode.useLimit
    ) {
        return invalidResponse('Access limit reached for this code.')
    }

    return { isValid: true, dbCode }
}

export const createSignedUrl = async (
    event: any,
    context: ScriptContext,
): Promise<LambdaResponse> => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const codeFromQuery: string | undefined = event.queryStringParameters?.code

    await insertUserLog(context.db, {
        code: codeFromQuery,
        data: omit(event, ['queryStringParameters']),
        loggedAt: context.now,
    })

    const validation = await validateSecretCode(
        codeFromQuery,
        context.db,
        context.now,
    )

    if (!validation.isValid) {
        return validation.errorResponse
    }

    const { dbCode } = validation

    try {
        const params = {
            Bucket: BUCKET_NAME,
            Key: dbCode.fileName,
            Expires: 30,
        }

        const s3 = new S3()
        const presignedUrl = await s3.getSignedUrlPromise('getObject', params)

        await useSecretCode(context.db, dbCode._id)

        return {
            statusCode: 302,
            headers: {
                Location: presignedUrl,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Expose-Headers': 'Location',
            },
            body: null,
        }
    } catch (error: any) {
        logError(error)
        return {
            statusCode: 400,
            body: JSON.stringify({
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                message:
                    error?.message ||
                    'Internal server error while generating signed URL.',
            }),
        }
    }
}
