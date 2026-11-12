import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { PopupService } from '@/lib/services/popupService';
import { parsePopupFields } from '@/lib/utils/popups';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        return NextResponse.json(await PopupService.list());
    } catch (error) {
        console.error('Error listing popups:', error);
        return NextResponse.json({ error: 'Failed to load popups' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const parsed = parsePopupFields(await request.json().catch(() => null));
    if ('error' in parsed) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    try {
        return NextResponse.json(await PopupService.create(parsed.fields), { status: 201 });
    } catch (error) {
        console.error('Error creating popup:', error);
        return NextResponse.json({ error: 'Failed to create popup' }, { status: 500 });
    }
}
