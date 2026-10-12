import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { ApiErrorCode } from '../../src/lib/types.js'
import { loadCity } from '../_lib/loadCity.js'

const SUCCESS_CACHE_CONTROL = 's-maxage=3600, stale-while-revalidate=86400'

const statusByCode: Record<ApiErrorCode, number> = {
  INVALID_USERNAME: 400,
  USER_NOT_FOUND: 404,
  RATE_LIMITED: 429,
  UPSTREAM_ERROR: 502,
}

const handler = async (request: VercelRequest, response: VercelResponse): Promise<void> => {
  const result = await loadCity(String(request.query.user))
  if (!result.ok) {
    response.setHeader('Cache-Control', result.code === 'USER_NOT_FOUND' ? 's-maxage=300' : 'no-store')
    response.status(statusByCode[result.code]).json({ error: result.code })
    return
  }

  response.setHeader('Cache-Control', SUCCESS_CACHE_CONTROL)
  response.status(200).json(result.city)
}

export default handler
