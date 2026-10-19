import { createApiClient } from '@ecocollect/api-contracts'
import { env } from '../config/env'

export const api = createApiClient({
    baseUrl: env.apiBaseUrl,
    useFixtures: true,
})