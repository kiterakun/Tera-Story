import { z } from 'zod';
import { validate } from '../../middleware/validate';

function mockResponse() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('validate middleware', () => {
  const schema = z.object({
    name: z.string().min(2),
    age: z.coerce.number().int().positive(),
  });

  it('passes valid data, replaces body with parsed data, and calls next', () => {
    const req: any = { body: { name: 'Aria', age: '21' } };
    const res = mockResponse();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(req.body).toEqual({ name: 'Aria', age: 21 });
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 400 with formatted issues for invalid data', () => {
    const req: any = { body: { name: 'A', age: -1 } };
    const res = mockResponse();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Validation failed',
      details: expect.arrayContaining([
        expect.objectContaining({ path: ['name'] }),
        expect.objectContaining({ path: ['age'] }),
      ]),
    }));
  });

  it('handles missing body as validation failure', () => {
    const req: any = {};
    const res = mockResponse();
    const next = vi.fn();

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].details.length).toBeGreaterThan(0);
  });
});
