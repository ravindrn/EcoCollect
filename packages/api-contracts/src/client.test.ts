import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { ApiError, createApiClient } from './client.ts'

describe('api client', () => {
    it('does not call fetch when fixtures are enabled', async () => {
        let calls = 0
        const client = createApiClient({
            baseUrl: 'http://localhost:4000/api/v1',
            useFixtures: true,
            fetchFn: async () => {
                calls += 1
                throw new Error('fetch shoud not be called')
            },
        })

        const tractors = await client.get<unknown[]>('/tractors')
        assert.equal(calls, 0)
        assert.equal(tractors.length, 5)
    })

    it('retries a network failure once', async () => {
        let calls = 0
        const client = createApiClient({
            baseUrl: 'http://localhost:4000/api/v1',
            useFixtures: false,
            fetchFn: async () => {
                calls += 1
                throw new Error('network down')
            },
        })

        await assert.rejects(() => client.get('/tractors'), (error: unknown) => {
            assert.ok(error instanceof ApiError)
            assert.equal(error.code, 'NETWORK')
            assert.equal(error.message, 'network down')
            return true
        })
        assert.equal(calls, 2)
    })
})