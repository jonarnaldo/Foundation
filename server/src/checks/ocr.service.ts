import { Injectable, BadRequestException, UnprocessableEntityException, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
  'image/webp', 'image/tiff', 'image/bmp', 'image/heic',
])

export interface OcrResult {
  check_number: string | null
  amount_cents: number | null
  payor_name: string | null
  memo_line: string | null
}

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name)

  constructor(private readonly config: ConfigService) {}

  async extractCheckFields(file: Express.Multer.File): Promise<OcrResult> {
    if (!file) {
      throw new BadRequestException('No file provided')
    }

    if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not supported. Please upload an image (JPEG, PNG, TIFF, etc.)`,
      )
    }

    const clientId = this.config.get<string>('VERYFI_CLIENT_ID')
    const clientSecret = this.config.get<string>('VERYFI_CLIENT_SECRET')
    const username = this.config.get<string>('VERYFI_USERNAME')
    const apiKey = this.config.get<string>('VERYFI_API_KEY')

    if (clientId && clientSecret && username && apiKey) {
      return this.callVeryfiApi(file, { clientId, clientSecret, username, apiKey })
    }

    return this.sandboxOcrResult(file)
  }

  private async callVeryfiApi(
    file: Express.Multer.File,
    creds: { clientId: string; clientSecret: string; username: string; apiKey: string },
  ): Promise<OcrResult> {
    const form = new FormData()
    const blob = new Blob([file.buffer as unknown as ArrayBuffer], { type: file.mimetype })
    form.append('file', blob, file.originalname)
    form.append('file_name', file.originalname)

    let response: Response
    try {
      response = await fetch('https://api.veryfi.com/api/v8/partner/documents/', {
        method: 'POST',
        headers: {
          'CLIENT-ID': creds.clientId,
          Authorization: `apikey ${creds.username}:${creds.apiKey}`,
        },
        body: form,
        signal: AbortSignal.timeout(30_000),
      })
    } catch (err) {
      this.logger.error('Veryfi API request failed', err)
      throw new UnprocessableEntityException('OCR service request timed out or failed. Please try again.')
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      this.logger.error(`Veryfi API returned ${response.status}: ${text}`)
      throw new UnprocessableEntityException(
        'Could not extract check information from this image. Please ensure it is a clear, readable check.',
      )
    }

    const parsed = await response.json() as Record<string, unknown>

    const amountRaw = parsed.total as number | null
    const amountCents = amountRaw != null ? Math.round(amountRaw * 100) : null

    return {
      check_number: (parsed.check_number as string | null) ?? null,
      amount_cents: amountCents,
      payor_name: ((parsed.vendor as Record<string, unknown> | null)?.name as string | null) ?? null,
      memo_line: (parsed.memo as string | null) ?? null,
    }
  }

  private sandboxOcrResult(file: Express.Multer.File): OcrResult {
    if (file.size < 1000) {
      throw new UnprocessableEntityException(
        'Could not extract check information from this image. The image may be blank or unreadable.',
      )
    }

    return {
      check_number: '1042',
      amount_cents: 300000,
      payor_name: 'Pacific Coast Development LLC',
      memo_line: 'Foundation work — Phase 1',
    }
  }
}
