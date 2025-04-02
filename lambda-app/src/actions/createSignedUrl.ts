import { logError } from '../helpers/util/log'
import { ScriptContext } from '../context'
import { insertUserLog } from '../client/userLogs'
import { checkAndUseSecretCode } from '../client/secretCodes'
import { S3 } from 'aws-sdk'

const BUCKET_NAME = process.env.BUCKET_NAME as string
const FILE_NAME = process.env.FILE_NAME as string
const EXPIRATION_DATE = process.env.EXPIRATION_DATE
    ? new Date(process.env.EXPIRATION_DATE)
    : new Date('1970-01-01')

export const createSignedUrl = async (event: any, context: ScriptContext) => {
    const code = event.queryStringParameters?.code

    if (!code) {
        return {
            statusCode: 403,
            body: JSON.stringify({ message: 'Code is required.' }),
        }
    }

    await insertUserLog({
        code,
        headers: event.headers,
        loggedAt: context.now,
    })

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
        const presignedUrl = await s3.getSignedUrlPromise('getObject', params)

        return {
            statusCode: 302,
            headers: { Location: presignedUrl },
            body: '',
        }
    } catch (error) {
        logError(error)
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' }),
        }
    }
}
