import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import { AppError } from './errors'

export const uploadsDir = path.resolve(process.cwd(), 'uploads')

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    fs.mkdirSync(uploadsDir, { recursive: true })
    callback(null, uploadsDir)
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase()
    const safeExtension = ['.jpg', '.jpeg', '.png', '.webp'].includes(extension) ? extension : '.jpg'
    callback(null, `${randomUUID()}${safeExtension}`)
  },
})

export const photoUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      callback(new AppError('Envie uma imagem JPG, PNG ou WEBP.', 400, 'INVALID_FILE'))
      return
    }
    callback(null, true)
  },
})
