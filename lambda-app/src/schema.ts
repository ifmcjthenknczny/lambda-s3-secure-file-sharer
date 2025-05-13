import { z } from 'zod'

export const createSecretCodesSchema = z.object({
    daysValid: z.number().int().positive().default(30),
    fileName: z.string().min(1),
    count: z.number().int().positive().default(1),
    useLimit: z.number().int().positive().optional(),
})

export const disableSecretCodesSchema = z
    .object({
        codes: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
    })
    .refine((data) => data.codes || data.tags, {
        message: 'At least one of "codes" or "tags" must be provided.',
    })
