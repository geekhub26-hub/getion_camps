import { Response } from 'express'
import { ApiResponse } from '../types'

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Succès',
  statusCode = 200,
  meta?: ApiResponse<T>['meta']
) => {
  const response: ApiResponse<T> = { success: true, message, data }
  if (meta) response.meta = meta
  return res.status(statusCode).json(response)
}

export const sendError = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: string[]
) => {
  const response: ApiResponse = { success: false, message }
  if (errors) response.errors = errors
  return res.status(statusCode).json(response)
}

export const sendCreated = <T>(res: Response, data: T, message = 'Créé avec succès') =>
  sendSuccess(res, data, message, 201)
