import type { FastifyPluginAsync } from 'fastify'
import { validate } from '../lib/validate.js'
import { authenticate, requireRole } from '../plugins/auth.js'
import { logActivity } from '../services/activityService.js'
import { idParamSchema } from '../services/contestantService.js'
import { addTeam, editTeam, getTeams, removeTeam } from '../services/teamService.js'

export const teamRoutes: FastifyPluginAsync = async (app) => {
  // GET /api/teams → { status, message, data: TeamDTO[] }
  // Read by the two dance judge screens (as scoring subjects) and by the
  // contestant form (to pick an affiliation).
  app.get('/teams', { preHandler: [authenticate] }, async () => {
    const data = await getTeams()
    return { status: 200, message: 'Teams fetched successfully.', data }
  })

  // POST /api/teams  { team }  (admin)
  app.post('/teams', { preHandler: [requireRole('admin')] }, async (request) => {
    const created = await addTeam(request.body)
    logActivity(request, 'team.create', created.team)
    return { status: 'success', message: 'Team created successfully.', data: created }
  })

  // PUT /api/teams/:id  (admin)
  app.put('/teams/:id', { preHandler: [requireRole('admin')] }, async (request) => {
    const { id } = validate(idParamSchema, request.params)
    const updated = await editTeam(id, request.body)
    logActivity(request, 'team.update', updated.team)
    return { status: 'success', message: 'Team updated successfully.', data: updated }
  })

  // DELETE /api/teams/:id  (admin) — refused while contestants or scores reference it
  app.delete('/teams/:id', { preHandler: [requireRole('admin')] }, async (request) => {
    const { id } = validate(idParamSchema, request.params)
    const removed = await removeTeam(id)
    logActivity(request, 'team.delete', removed.team)
    return { status: 'success', message: 'Team deleted successfully.' }
  })
}
