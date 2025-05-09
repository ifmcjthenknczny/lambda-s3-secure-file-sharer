import {z} from 'zod'

export const createSecretCodesRawEventSchema = z.object({
    expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fileName: z.string().min(1),
    count: z.number().int().positive().default(1)
})