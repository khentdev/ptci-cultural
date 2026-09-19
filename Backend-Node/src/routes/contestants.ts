import type { FastifyPluginAsync } from 'fastify'
import { validate } from '../lib/validate.js'
import { authenticate, requireRole } from '../plugins/auth.js'
import { logActivity } from '../services/activityService.js'
import {
  addContestant,
  editContestant,
  getContestants,
  idParamSchema,
  removeContestant,
} from '../services/contestantService.js'

export const contestantRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/contestants → { status, message, data: ContestantDTO[] }
  // Gender is returned for display; it is never a filter.
  app.get('/contestants', { preHandler: [authenticate] }, async () => {
    const data = await getContestants()
    return { status: 200, message: 'Contestants fetched successfully.', data }
  })

  // POST /api/contestants  { cand_number, cand_name, team_id, cand_gender }  (admin)
  app.post('/contestants', { preHandler: [requireRole('admin')] }, async (request) => {
    const created = await addContestant(request.body)
    logActivity(request, 'contestant.create', `#${created.cand_number} ${created.cand_name} (${created.cand_gender})`)
    return { status: 'success', message: 'Contestant created successfully.', data: created }
  })

  // PUT /api/contestants/:id  (admin)
  app.put('/contestants/:id', { preHandler: [requireRole('admin')] }, async (request) => {
    const { id } = validate(idParamSchema, request.params)
    const updated = await editContestant(id, request.body)
    logActivity(request, 'contestant.update', `#${updated.cand_number} ${updated.cand_name} (${updated.cand_gender})`)
    return { status: 'success', message: 'Contestant updated successfully.', data: updated }
  })

  // DELETE /api/contestants/:id  (admin) — cascades to all of the contestant's scores
  app.delete('/contestants/:id', { preHandler: [requireRole('admin')] }, async (request) => {
    const { id } = validate(idParamSchema, request.params)
    const removed = await removeContestant(id)
    logActivity(request, 'contestant.delete', `#${removed.cand_number} ${removed.cand_name} (${removed.cand_gender})`)
    return { status: 'success', message: 'Contestant deleted successfully.' }
  })
}
