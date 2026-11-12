// datetime-local inputs have no timezone, so convert to and from the browser's local time
export const toLocalInput = (iso: string) => {
    const date = new Date(iso);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export const fromLocalInput = (local?: string) => (local ? new Date(local).toISOString() : undefined);
