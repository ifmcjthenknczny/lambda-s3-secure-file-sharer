import { logError } from '../helpers/util/log'
import { ScriptContext } from '../context'
import { insertUserLog } from '../client/userLogs'
import { checkAndUseSecretCode } from '../client/secretCodes'
import { S3 } from 'aws-sdk'
import { omit } from '../helpers/util/object'
import { log } from 'console'

const BUCKET_NAME = process.env.BUCKET_NAME as string
const FILE_NAME = process.env.FILE_NAME as string
const EXPIRATION_DATE = process.env.EXPIRATION_DATE
    ? new Date(process.env.EXPIRATION_DATE)
    : new Date('1970-01-01')

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

    const isCodeValid = await checkAndUseSecretCode(code)

    if (!isCodeValid) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Code is invalid.' }),
        }
    }

    if (context.now > EXPIRATION_DATE) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Access expired.' }),
        }
    }

    try {
        const params = {
            Bucket: BUCKET_NAME,
            Key: FILE_NAME,
            Expires: 60,
        }

        const s3 = new S3()
        log({ params })
        const presignedUrl = await s3.getSignedUrlPromise('getObject', params)

        log({ presignedUrl })

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
