import {z} from 'zod'

export const createSecretCodesRawEventSchema = z.object({
    daysValid: z.number().int().positive().default(30),
    fileName: z.string().min(1),
    count: z.number().int().positive().default(1),
    useLimit: z.number().int().positive().optional()
})