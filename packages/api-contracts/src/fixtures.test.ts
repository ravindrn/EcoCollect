import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadFixtures } from './fixtures.ts'

const weekend = ['SAT' , 'SUN']

describe('fixtues', () => {
    it('has 5 tractors and 5 routes' , () => {
        const data = loadFixtures()
        assert.equal(data.tractors.length, 5)
        assert.equal(data.routes.length, 5)
    })

    it('schedules weekdays only', () => {
        const data = loadFixtures()
        for (const route of data.routes) {
            assert.ok(route.weekdays.includes('MON')) 
            for (const day of route.weekdays) {
                assert.equal(weekend.includes(day), false)
            }
        }
    })
})