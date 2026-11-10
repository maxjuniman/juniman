import { Router } from 'express'
import { asyncHandler } from '../../lib/async-handler'
import { requireAuth, type AuthedRequest } from '../../middleware/auth'
import { addMemberSchema } from '../../shared'
import { addFamilyMember } from './families.service'
import { getFamilies } from './family-context'

export const familiesRouter = Router()

familiesRouter.use(requireAuth)

familiesRouter.get(
  '/me',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    response.json(await getFamilies(userId))
  }),
)

familiesRouter.post(
  '/me/members',
  asyncHandler(async (request, response) => {
    const { userId } = request as AuthedRequest
    const input = addMemberSchema.parse(request.body)
    response.status(201).json(await addFamilyMember(userId, input.email))
  }),
)
