import { clearTimeout } from "node:timers"
import { loadFixtures } from "./fixtures.ts"
export class ApiError extends Error {
    code: string

    constructor(message: string, code: string){
        super(message)
        this.name = 'ApiError'
        this.code = code
    }
}

    type RequestOptions = {
        signal?: AbortSignal
    }

    export type FetchFn = (url: string, options?: RequestOptions) => Promise<Response>
    export type ApiClientOptions = {
        baseUrl: string
        useFixtures: boolean
        timeoutMs?: number
        fetchFn?: FetchFn
    }

    const fixturesByPath: Record<string, unknown> = {
        '/tractors': loadFixtures().tractors,
        '/routes': loadFixtures().routes,
    }

    export function createApiClient(options: ApiClientOptions) {
        const timeoutMs = options.timeoutMs ?? 8000
        const fetchFn = options.fetchFn ?? fetch

        async function requestOnce<T> (path: string): Promise<T> {
            const controller = new AbortController()
            const timer = setTimeout(() => controller.abort(),timeoutMs)

            try{
                const response = await fetchFn(`${options.baseUrl}${path}`,{
                    signal: controller.signal,
                })

                if(!response.ok) {
                    throw new ApiError(`Request Failed (${response.status})`, `HTTP_${response.status}`)
                }
                return (await response.json()) as T

            } finally {
                clearTimeout(timer)
            }
        }

        return {
            async get<T>(path: string): Promise<T> {
                if (options.useFixtures) {
                    if(!(path in fixturesByPath)) {
                        throw new ApiError(`No fixture for ${path}`, `FIXTURE_NOT_FOUND`)
                    }
                    return fixturesByPath[path] as T
                }
                let lastError: unknown

                for (let attempt =0; attempt < 2; attempt += 1) {
                    try{
                        return await requestOnce<T>(path)
                    }catch (error) {
                        if (error instanceof ApiError) throw error
                        lastError = error
                    }
                }

                const code = lastError instanceof Error && lastError.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK'
                const message = lastError instanceof Error ? lastError.message : 'Network request failed'
                throw new ApiError(message, code)
            },
        }
    }
