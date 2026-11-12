import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { PopupService } from '@/lib/services/popupService';
import { parsePopupFields } from '@/lib/utils/popups';

interface RouteContext {
    params: { id: string };
}

export async function PUT(request: Request, { params }: RouteContext) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    const parsed = parsePopupFields(await request.json().catch(() => null));
    if ('error' in parsed) {
        return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    try {
        const popup = await PopupService.update(params.id, parsed.fields);
        if (!popup) return NextResponse.json({ error: 'Popup not found' }, { status: 404 });
        return NextResponse.json(popup);
    } catch (error) {
        console.error('Error updating popup:', error);
        return NextResponse.json({ error: 'Failed to update popup' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: RouteContext) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const removed = await PopupService.remove(params.id);
        if (!removed) return NextResponse.json({ error: 'Popup not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting popup:', error);
        return NextResponse.json({ error: 'Failed to delete popup' }, { status: 500 });
    }
}
