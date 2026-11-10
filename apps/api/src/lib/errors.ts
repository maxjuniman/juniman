export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code = 'APP_ERROR',
  ) {
    super(message)
  }
}
