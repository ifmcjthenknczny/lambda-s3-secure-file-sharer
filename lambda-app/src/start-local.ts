import { ActionType, lambda } from './lambda-app'

const config = {
    action: ActionType.CREATE_SECRET_CODES,
    rawEvent: {
        count: 10,
        fileName: 'file.pdf',
        daysValid: 75,
        useLimit: 10,
    },
    executionId: 'local',
    runningLocal: true,
}

lambda(config)
