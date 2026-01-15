export function sanitizeEmailHtml(dirtyHtml) {
    if (!dirtyHtml) return '';
    if (typeof DOMParser === 'undefined') return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml, 'text/html');

    // Remove high-risk elements entirely
    const blockedTags = [
        'script',
        'iframe',
        'object',
        'embed',
        'link',
        'meta',
        'base',
        'form',
        'input',
        'button',
        'textarea',
        'select',
        'option',
    ];
    for (const tag of blockedTags) {
        doc.querySelectorAll(tag).forEach((el) => el.remove());
    }

    // Strip inline event handlers and javascript: URLs
    doc.querySelectorAll('*').forEach((el) => {
        [...el.attributes].forEach((attr) => {
            const name = attr.name.toLowerCase();
            const value = (attr.value || '').trim();

            if (name.startsWith('on')) {
                el.removeAttribute(attr.name);
                return;
            }

            if (name === 'srcdoc') {
                el.removeAttribute(attr.name);
                return;
            }

            const isUrlAttr = name === 'href' || name === 'src' || name === 'xlink:href' || name === 'formaction';
            if (isUrlAttr && value) {
                const lower = value.toLowerCase();
                if (lower.startsWith('javascript:') || lower.startsWith('data:text/html')) {
                    el.removeAttribute(attr.name);
                    return;
                }
            }
        });

        if (el.tagName.toLowerCase() === 'a' && el.getAttribute('target') === '_blank') {
            const rel = (el.getAttribute('rel') || '').split(/\s+/).filter(Boolean);
            if (!rel.includes('noopener')) rel.push('noopener');
            if (!rel.includes('noreferrer')) rel.push('noreferrer');
            el.setAttribute('rel', rel.join(' '));
        }
    });

    return doc.body.innerHTML;
}

