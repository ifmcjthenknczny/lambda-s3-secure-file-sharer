import { logError } from '../helpers/util/log'
import { ScriptContext } from '../context'
import { insertUserLog } from '../client/userLogs'
import { findSecretCode, useSecretCode } from '../client/secretCodes'
import { S3 } from 'aws-sdk'
import { omit } from '../helpers/util/object'
import dayjs from 'dayjs'

const BUCKET_NAME = process.env.BUCKET_NAME as string

export const createSignedUrl = async (event: any, context: ScriptContext) => {
    const code = event.queryStringParameters?.code

    await insertUserLog({
        code,
        data: omit(event, ['queryStringParameters']),
        loggedAt: context.now,
    })

    if (!code) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Code is required.' }),
        }
    }

    const dbCode = await findSecretCode(code)

    if (!dbCode) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Code is invalid.' }),
        }
    }

    if (dayjs(context.now).isAfter(dayjs(dbCode.expiresAt))) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Access expired.' }),
        }
    }

    try {
        const params = {
            Bucket: BUCKET_NAME,
            Key: dbCode.fileName,
            Expires: 60,
        }

        const s3 = new S3()
        const presignedUrl = await s3.getSignedUrlPromise('getObject', params)
        
        await useSecretCode(code)

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
                message: error?.message || 'Internal server error',
            }),
        }
    }
}
