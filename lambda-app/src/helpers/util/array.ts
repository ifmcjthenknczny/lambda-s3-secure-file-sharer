export function chunkify<T>(array: T[], chunkSize: number): T[][] {
    const result = []
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize))
    }
    return result
}

export const range = (start: number, end: number, step = 1): number[] => {
    if (step === 0) throw new Error('Step cannot be 0')
    const result: number[] = []
    const ascending = step > 0

    for (let i = start; ascending ? i < end : i > end; i += step) {
        result.push(i)
    }

    return result
}
