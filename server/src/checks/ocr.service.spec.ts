import { Test } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { BadRequestException, UnprocessableEntityException } from '@nestjs/common'
import { OcrService } from './ocr.service'

function makeFile(opts: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'image',
    originalname: 'check.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 50000,
    buffer: Buffer.alloc(50000, 0xff),
    destination: '',
    filename: '',
    path: '',
    stream: null as never,
    ...opts,
  }
}

describe('OcrService', () => {
  let svc: OcrService

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OcrService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile()
    svc = module.get(OcrService)
  })

  it('throws 400 for non-image file types', async () => {
    const file = makeFile({ mimetype: 'text/plain', originalname: 'check.txt' })
    await expect(svc.extractCheckFields(file)).rejects.toThrow(BadRequestException)
  })

  it('throws 400 when no file provided', async () => {
    await expect(svc.extractCheckFields(null as never)).rejects.toThrow(BadRequestException)
  })

  it('throws 422 for blank/tiny image files', async () => {
    const file = makeFile({ size: 100, buffer: Buffer.alloc(100) })
    await expect(svc.extractCheckFields(file)).rejects.toThrow(UnprocessableEntityException)
  })

  it('returns normalized fields for a valid image in sandbox mode', async () => {
    const file = makeFile()
    const result = await svc.extractCheckFields(file)
    expect(result).toHaveProperty('check_number')
    expect(result).toHaveProperty('amount_cents')
    expect(result).toHaveProperty('payor_name')
    expect(result).toHaveProperty('memo_line')
  })

  it('sandbox mode returns amount_cents as integer (no raw Veryfi data)', async () => {
    const file = makeFile()
    const result = await svc.extractCheckFields(file)
    expect(typeof result.amount_cents).toBe('number')
    expect(Number.isInteger(result.amount_cents)).toBe(true)
    expect(result).not.toHaveProperty('total')
    expect(result).not.toHaveProperty('vendor')
  })

  it('sandbox returns $3,000.00 → amount_cents 300000', async () => {
    const file = makeFile()
    const result = await svc.extractCheckFields(file)
    expect(result.amount_cents).toBe(300000)
  })

  it('accepts JPEG, PNG, and TIFF file types', async () => {
    for (const mimetype of ['image/jpeg', 'image/png', 'image/tiff']) {
      const file = makeFile({ mimetype })
      const result = await svc.extractCheckFields(file)
      expect(result).toHaveProperty('amount_cents')
    }
  })
})
