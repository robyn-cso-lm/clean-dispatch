import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (type === 'cleaners') {
    const cleaners = await prisma.cleaner.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        backgroundCheckStatus: true,
        checkrStatus: true,
        rating: true,
        reviewCount: true,
        totalHours: true,
        createdAt: true,
        _count: { select: { jobs: true } },
        workPhotos: { select: { id: true, driveItemId: true } },
        payouts: {
          select: { amount: true, status: true },
        },
      },
    });
    return NextResponse.json({ cleaners });
  }

  if (type === 'jobs') {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        client: { select: { name: true, email: true } },
        assignment: {
          include: { cleaner: { select: { name: true } } },
        },
      },
    });
    return NextResponse.json({ jobs });
  }

  if (type === 'clients') {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { jobs: true } },
      },
    });
    return NextResponse.json({ clients });
  }

  if (type === 'overview') {
    const [
      totalCleaners,
      pendingCleaners,
      totalJobs,
      recentJobs,
      revenueResult,
    ] = await Promise.all([
      prisma.cleaner.count({ where: { backgroundCheckStatus: 'approved' } }),
      prisma.cleaner.count({ where: { backgroundCheckStatus: 'pending' } }),
      prisma.job.count(),
      prisma.job.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          client: { select: { name: true } },
          assignment: { include: { cleaner: { select: { name: true } } } },
        },
      }),
      prisma.payment.aggregate({
        where: { status: 'succeeded' },
        _sum: { amount: true },
      }),
    ]);

    return NextResponse.json({
      totalCleaners,
      pendingCleaners,
      totalJobs,
      recentJobs,
      totalRevenue: revenueResult._sum.amount ?? 0,
    });
  }

  return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
}
