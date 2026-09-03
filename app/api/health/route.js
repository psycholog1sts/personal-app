export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(
    {
      ok: true,
      service: 'rlsproof',
      version: '0.2.0',
    },
    {
      headers: {
        'cache-control': 'no-store, max-age=0',
        'x-content-type-options': 'nosniff',
      },
    },
  );
}
