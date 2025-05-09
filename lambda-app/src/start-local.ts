import dayjs from 'dayjs'
import { ActionType, lambda } from './lambda-app'
import { toDay } from './helpers/util/date'

const config = {
    action: ActionType.CREATE_SECRET_CODES,
    rawEvent: {
        count: 50,
        fileName: 'xxx.pdf',
        expiresAt: toDay(dayjs().add(1, 'month'))
    },
    executionId: 'local',
    runningLocal: true,
}

lambda(config)
