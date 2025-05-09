import { ActionType, lambda } from './lambda-app'

const config = {
    action: ActionType.CREATE_SECRET_CODES,
    rawEvent: {
        count: 50,
        fileName: 'cv.pdf',
        daysValid: 30,
        useLimit: 10
    },
    executionId: 'local',
    runningLocal: true,
}

lambda(config)
