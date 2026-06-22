import { describe, it, expect, vi, afterEach } from 'vitest'
import { fetchWorkday, fetchPhenom } from './fetchers.js'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchWorkday', () => {
  it('POSTs to the CXS jobs endpoint and normalizes postings', async () => {
    const calls = []
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url, opts })
      return {
        ok: true,
        json: async () => ({
          jobPostings: [
            { title: 'Radar Systems Engineer', externalPath: '/job/Florida-Melbourne/Radar_R1', locationsText: 'Melbourne, FL' },
          ],
        }),
      }
    })

    const out = await fetchWorkday({
      company: 'Northrop Grumman',
      track: 'defense',
      host: 'ngc.wd1.myworkdayjobs.com',
      tenant: 'ngc',
      site: 'Northrop_Grumman_External_Site',
      searchText: 'Melbourne',
      maxPages: 1,
    })

    expect(calls[0].url).toBe('https://ngc.wd1.myworkdayjobs.com/wday/cxs/ngc/Northrop_Grumman_External_Site/jobs')
    expect(calls[0].opts.method).toBe('POST')
    expect(JSON.parse(calls[0].opts.body)).toMatchObject({ searchText: 'Melbourne', offset: 0, limit: 20 })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      title: 'Radar Systems Engineer',
      company: 'Northrop Grumman',
      location: 'Melbourne, FL',
      url: 'https://ngc.wd1.myworkdayjobs.com/Northrop_Grumman_External_Site/job/Florida-Melbourne/Radar_R1',
      source: 'workday:ngc',
    })
  })

  it('stops paginating once a short page is returned', async () => {
    const full = Array.from({ length: 20 }, (_, i) => ({
      title: `Job ${i}`,
      externalPath: `/job/x/J${i}`,
      locationsText: 'Melbourne, FL',
    }))
    let page = 0
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ jobPostings: page++ === 0 ? full : [{ title: 'Last', externalPath: '/job/x/L', locationsText: 'Melbourne, FL' }] }),
    }))

    const out = await fetchWorkday({ company: 'X', track: 'defense', host: 'h', tenant: 't', site: 's', maxPages: 5 })
    // page 0 returns 20 (continue), page 1 returns 1 (<20 -> stop)
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(out).toHaveLength(21)
  })
})

describe('fetchPhenom', () => {
  it('POSTs refineSearch to /widgets and normalizes jobs (relative url + date)', async () => {
    const calls = []
    global.fetch = vi.fn(async (url, opts) => {
      calls.push({ url, opts })
      return {
        ok: true,
        json: async () => ({
          refineSearch: {
            data: {
              jobs: [
                {
                  title: 'RF Engineer',
                  cityStateCountry: 'Melbourne, Florida, United States',
                  jobSeoUrl: '/en/job/rf-engineer/12345',
                  postedDate: '2026-06-10T00:00:00Z',
                  jobId: '12345',
                },
              ],
            },
          },
        }),
      }
    })

    const out = await fetchPhenom({ company: 'L3Harris', track: 'defense', host: 'careers.l3harris.com', keyword: 'Melbourne', maxPages: 1 })

    expect(calls[0].url).toBe('https://careers.l3harris.com/widgets')
    expect(JSON.parse(calls[0].opts.body)).toMatchObject({ ddoKey: 'refineSearch', keywords: 'Melbourne', from: 0 })
    expect(out[0]).toMatchObject({
      title: 'RF Engineer',
      company: 'L3Harris',
      location: 'Melbourne, Florida, United States',
      url: 'https://careers.l3harris.com/en/job/rf-engineer/12345',
      source: 'phenom:careers.l3harris.com',
      postedAt: '2026-06-10',
    })
  })

  it('falls back to city/state and absolute applyUrl', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        refineSearch: { data: { jobs: [{ title: 'Avionics Tech', city: 'Palm Bay', state: 'FL', applyUrl: 'https://x.co/apply/9' }] } },
      }),
    }))
    const out = await fetchPhenom({ company: 'L3Harris', track: 'defense', host: 'careers.l3harris.com', maxPages: 1 })
    expect(out[0]).toMatchObject({ location: 'Palm Bay, FL', url: 'https://x.co/apply/9' })
  })
})
