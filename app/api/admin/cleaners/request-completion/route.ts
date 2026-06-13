import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/graphMail';
import { inviteCandidate, checkrConfigured } from '@/lib/checkr';

// Emails existing cleaners a link to finish onboarding: complete their
// background check, upload work photos, and confirm availability.
// Body: { cleanerId } for one, or { all: true } for every cleaner still
// missing work photos or a cleared background check.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { cleanerId, all } = body;

  const where = cleanerId
    ? { id: cleanerId }
    : all
    ? { OR: [{ workPhotos: { none: {} } }, { checkrStatus: { in: ['none', 'error'] } }] }
    : null;

  if (!where) {
    return NextResponse.json({ error: 'Provide cleanerId or all:true.' }, { status: 400 });
  }

  const cleaners = await prisma.cleaner.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      accessToken: true,
      checkrStatus: true,
      _count: { select: { workPhotos: true } },
    },
  });

  if (cleaners.length === 0) {
    return NextResponse.json({ sent: 0, results: [], message: 'No matching cleaners.' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const results: { name: string; email: string; emailSent: boolean; checkr: string; error?: string }[] = [];

  for (const c of cleaners) {
    // Make sure they have a personal link.
    let token = c.accessToken;
    if (!token) {
      token = crypto.randomUUID();
      await prisma.cleaner.update({ where: { id: c.id }, data: { accessToken: token } });
    }

    // Kick off the background check if it hasn't started and Checkr is wired up.
    let checkr = c.checkrStatus;
    if (checkrConfigured() && (checkr === 'none' || checkr === 'error')) {
      try {
        const invite = await inviteCandidate({ name: c.name, email: c.email, phone: c.phone });
        if (invite) {
          await prisma.cleaner.update({
            where: { id: c.id },
            data: { checkrCandidateId: invite.candidateId, checkrStatus: invite.status },
          });
          checkr = invite.status;
        }
      } catch (err) {
        console.error(`Checkr invite failed for ${c.email}:`, err);
      }
    }

    const link = `${appUrl}/cleaner/availability?token=${token}`;
    const needsPhotos = c._count.workPhotos === 0;
    const checkrLine = checkrConfigured()
      ? `<li><strong>Complete your background check.</strong> You'll get a separate email from our screening partner (Checkr) — please finish it as soon as you can.</li>`
      : '';

    try {
      await sendMail(
        c.email,
        'Action needed: finish your CleanDispatch profile ☀️',
        `<div style="font-family:Arial,sans-serif;color:#1f2a33;line-height:1.6">
          <h2 style="color:#0e5552">Hi ${c.name.split(' ')[0]},</h2>
          <p>We're updating CleanDispatch and need a couple of quick things from you so we can keep sending you jobs:</p>
          <ul>
            ${checkrLine}
            ${needsPhotos ? `<li><strong>Upload a few photos of your work</strong> (before/after shots are great). Our cleaners are the face of the company.</li>` : ''}
            <li><strong>Confirm your weekly availability</strong> so we match you to the right jobs.</li>
          </ul>
          <p style="margin:24px 0">
            <a href="${link}" style="background:#0ba59f;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold">
              Finish my profile →
            </a>
          </p>
          <p style="font-size:13px;color:#6b7280">This link is personal to you — please don't share it. Questions? Just reply to this email.</p>
          <p style="color:#0e5552;font-weight:bold">— The CleanDispatch Team</p>
        </div>`
      );
      results.push({ name: c.name, email: c.email, emailSent: true, checkr });
    } catch (err) {
      console.error(`Onboarding email failed for ${c.email}:`, err);
      results.push({
        name: c.name,
        email: c.email,
        emailSent: false,
        checkr,
        error: err instanceof Error ? err.message : 'send failed',
      });
    }
  }

  const sent = results.filter((r) => r.emailSent).length;
  return NextResponse.json({ sent, total: results.length, results });
}
