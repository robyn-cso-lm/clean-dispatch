import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMail } from '@/lib/graphMail';
import { uploadFile } from '@/lib/graphFiles';
import { inviteCandidate, checkrConfigured } from '@/lib/checkr';

// Accepts multipart/form-data:
//   name, email, phone               (text)
//   availability                     (JSON string: { "<dayOfWeek>": {start,end} })
//   bankAccount                      (optional text)
//   photos                           (one or more image files — samples of past work)
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const phone = String(form.get('phone') ?? '').trim();
    const bankAccount = form.get('bankAccount') ? String(form.get('bankAccount')) : null;

    let availability: Record<string, { start: string; end: string }> = {};
    try {
      availability = JSON.parse(String(form.get('availability') ?? '{}'));
    } catch {
      availability = {};
    }

    if (!name || !email || !phone) {
      return NextResponse.json({ error: 'Name, email and phone are required.' }, { status: 400 });
    }

    const photos = form.getAll('photos').filter((p): p is File => p instanceof File && p.size > 0);
    if (photos.length === 0) {
      return NextResponse.json(
        { error: 'Please upload at least one photo of your past work.' },
        { status: 400 }
      );
    }

    const existing = await prisma.cleaner.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    const cleaner = await prisma.cleaner.create({
      data: {
        email,
        phone,
        name,
        bankAccount,
        backgroundCheckStatus: 'pending',
        ...(Object.keys(availability).length > 0 && {
          availability: {
            create: Object.entries(availability).map(([day, times]) => ({
              dayOfWeek: parseInt(day, 10),
              startTime: times.start,
              endTime: times.end,
              isAvailable: true,
            })),
          },
        }),
      },
    });

    // Upload work photos to OneDrive via Graph. Each successful upload is
    // recorded; failures are logged but don't abort signup.
    let uploaded = 0;
    for (let i = 0; i < photos.length; i++) {
      const file = photos[i];
      try {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        const buffer = Buffer.from(await file.arrayBuffer());
        const { driveItemId } = await uploadFile(
          `CleanDispatch/cleaners/${cleaner.id}/work-${i + 1}.${ext}`,
          buffer,
          file.type || 'image/jpeg'
        );
        await prisma.cleanerWorkPhoto.create({ data: { cleanerId: cleaner.id, driveItemId } });
        uploaded++;
      } catch (err) {
        console.error(`Work photo ${i + 1} upload failed:`, err);
      }
    }

    // Kick off the Checkr background check (no-op if not configured).
    if (checkrConfigured()) {
      try {
        const result = await inviteCandidate({ name, email, phone });
        if (result) {
          await prisma.cleaner.update({
            where: { id: cleaner.id },
            data: { checkrCandidateId: result.candidateId, checkrStatus: result.status },
          });
        }
      } catch (err) {
        console.error('Checkr invitation failed:', err);
        await prisma.cleaner
          .update({ where: { id: cleaner.id }, data: { checkrStatus: 'error' } })
          .catch(() => {});
      }
    }

    // Welcome email to cleaner
    sendMail(
      email,
      'Welcome to Camica Clean Dispatch — Application Received',
      `<h2>Hi ${name},</h2>
      <p>Thanks for applying! Your application is under review.</p>
      ${
        checkrConfigured()
          ? `<p>You'll receive a separate email to complete your background check — please finish it so we can approve you.</p>`
          : ''
      }
      <p>We'll be in touch within 24-48 hours.</p>`
    ).catch((err) => console.error('Welcome email failed:', err));

    // Admin alert to Robyn
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.MAIL_FROM;
    if (adminEmail) {
      sendMail(
        adminEmail,
        `New Cleaner Application — ${name}`,
        `<h2>New cleaner application received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Work photos:</strong> ${uploaded} uploaded</p>
        <p><strong>Background check:</strong> ${checkrConfigured() ? 'invitation sent' : 'not configured'}</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard">Review in admin dashboard →</a></p>`
      ).catch((err) => console.error('Admin alert email failed:', err));
    }

    return NextResponse.json(
      { success: true, cleanerId: cleaner.id, photosUploaded: uploaded },
      { status: 201 }
    );
  } catch (error) {
    console.error('Cleaner signup error:', error);
    return NextResponse.json({ error: 'Failed to create cleaner account' }, { status: 500 });
  }
}
