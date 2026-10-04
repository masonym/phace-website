/**
 * Product URLs look like /store/product/lipid-cleansing-oil-W62UWFY35CWMYGVWK6TWJDNI.
 * Square object IDs never contain hyphens, so the ID is always the last segment,
 * and older ID-only links keep working.
 */
export function productPath(id: string, name?: string | null): string {
    const slug = (name ?? '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80)
        .replace(/-+$/g, '');
    return `/store/product/${slug ? `${slug}-` : ''}${id}`;
}

export function productIdFromParam(param: string): string {
    const decoded = decodeURIComponent(param);
    return decoded.slice(decoded.lastIndexOf('-') + 1);
}
