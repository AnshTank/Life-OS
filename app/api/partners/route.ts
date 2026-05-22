import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (type && type !== 'all') where.partnerType = type;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const partners = await prisma.partner.findMany({
      where,
      include: {
        _count: {
          select: {
            projects: true,
            goals: true,
            tasks: true,
            notes: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(partners);
  } catch (error) {
    console.error('Failed to fetch partners:', error);
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, email, phone, website, avatar, company, role, address, tags, partnerType, status, priority, socialLinks } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const partner = await prisma.partner.create({
      data: {
        name,
        description,
        email,
        phone,
        website,
        avatar,
        company,
        role,
        address,
        tags: tags || [],
        partnerType,
        status: status || 'active',
        priority: priority || 'medium',
        socialLinks: socialLinks || undefined,
      },
      include: {
        _count: {
          select: { projects: true, goals: true, tasks: true, notes: true }
        }
      }
    });

    return NextResponse.json(partner);
  } catch (error) {
    console.error('Failed to create partner:', error);
    return NextResponse.json({ error: 'Failed to create partner' }, { status: 500 });
  }
}
