'use client';

import ReactMarkdown from 'react-markdown';
import { isExternalUrl, isSafeUrl, type PopupContent } from '@/lib/utils/popups';

interface PopupCardProps {
    popup: PopupContent;
    onClose: () => void;
    /** 'responsive' puts the image beside the text on wide screens; 'stacked' always puts it on top */
    layout?: 'responsive' | 'stacked';
    titleId?: string;
}

const linkProps = (url: string) =>
    isExternalUrl(url) ? { target: '_blank', rel: 'noopener noreferrer' } : {};

/** The popup's contents. PopupModal wraps it in the overlay; the admin preview renders it on its own. */
export default function PopupCard({ popup, onClose, layout = 'responsive', titleId = 'site-popup-title' }: PopupCardProps) {
    const imageUrl = popup.imageUrl && isSafeUrl(popup.imageUrl) ? popup.imageUrl : undefined;
    const ctaUrl = popup.ctaUrl && isSafeUrl(popup.ctaUrl) ? popup.ctaUrl : undefined;
    const sideBySide = layout === 'responsive' && !!imageUrl;

    return (
        <div
            className={`relative bg-[#FFFBF0] rounded-xl shadow-xl w-full max-h-[90vh] overflow-y-auto ${
                sideBySide ? 'max-w-2xl xl:max-w-5xl xl:grid xl:grid-cols-[3fr_2fr]' : 'max-w-2xl'
            }`}
        >
            <button
                onClick={onClose}
                className="absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 text-[#59637E] hover:bg-white text-2xl leading-none shadow-sm focus:outline-none focus:ring-2 focus:ring-[#59637E]/30"
                aria-label="Close"
            >
                ×
            </button>

            {imageUrl && (
                <div className={`relative ${sideBySide ? 'xl:min-h-[28rem]' : ''}`}>
                    {/* Plain img: admins can paste images from anywhere, which next/image would reject */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={imageUrl}
                        alt={popup.imageAlt ?? ''}
                        className={`w-full max-h-[40vh] object-cover ${sideBySide ? 'xl:absolute xl:inset-0 xl:h-full xl:max-h-none' : ''}`}
                    />
                </div>
            )}

            <div className="p-6 sm:p-8">
                {popup.eyebrow && (
                    <p className="text-xs uppercase tracking-[0.2em] text-[#8A6A5B] mb-2 pr-10">{popup.eyebrow}</p>
                )}
                <h2 id={titleId} className="text-3xl text-[#59637E] mb-3 pr-10">
                    {popup.title}
                </h2>

                {popup.body && (
                    <div className="text-[#59637E]/80 mb-5 space-y-3">
                        <ReactMarkdown
                            components={{
                                a: ({ href, children }) =>
                                    href && isSafeUrl(href) ? (
                                        <a href={href} {...linkProps(href)} className="underline text-[#8A6A5B]">
                                            {children}
                                        </a>
                                    ) : (
                                        <>{children}</>
                                    ),
                                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
                                strong: ({ children }) => <strong className="font-semibold text-[#59637E]">{children}</strong>,
                                // Headings would compete with the title, so render them as bold paragraphs
                                h1: ({ children }) => <p className="font-semibold text-[#59637E]">{children}</p>,
                                h2: ({ children }) => <p className="font-semibold text-[#59637E]">{children}</p>,
                                h3: ({ children }) => <p className="font-semibold text-[#59637E]">{children}</p>,
                                img: () => null,
                            }}
                        >
                            {popup.body}
                        </ReactMarkdown>
                    </div>
                )}

                {popup.bullets.length > 0 && (
                    <ul className="space-y-1.5 mb-6 text-sm text-[#59637E]">
                        {popup.bullets.map((bullet, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="text-[#8A6A5B]" aria-hidden="true">✓</span>
                                <span>{bullet}</span>
                            </li>
                        ))}
                    </ul>
                )}

                {(popup.price || popup.highlight) && (
                    <div className="border-y border-[#DEC3C5] py-4 mb-6">
                        {popup.price && (
                            <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-3xl text-[#59637E]">{popup.price}</span>
                                {popup.priceNote && <span className="text-sm text-[#59637E]/70">{popup.priceNote}</span>}
                            </div>
                        )}
                        {popup.highlight && (
                            <p className={`text-[#8A6A5B] font-medium ${popup.price ? 'mt-1' : ''}`}>{popup.highlight}</p>
                        )}
                    </div>
                )}

                {ctaUrl && popup.ctaLabel && (
                    <a
                        href={ctaUrl}
                        {...linkProps(ctaUrl)}
                        className="block w-full bg-[#8A6A5B] hover:bg-[#8A6A5B]/90 text-white font-medium py-3 px-4 rounded-md text-center transition-colors focus:outline-none focus:ring-2 focus:ring-[#8A6A5B]/50"
                    >
                        {popup.ctaLabel}
                    </a>
                )}

                {popup.ctaNote && (
                    <p className="text-sm text-[#59637E]/80 text-center mt-3">{popup.ctaNote}</p>
                )}
            </div>

            <div className={`px-6 sm:px-8 pb-6 ${sideBySide ? 'xl:col-span-2 xl:pt-6' : ''}`}>
                {popup.finePrint && (
                    <p className="text-xs text-[#59637E]/60 leading-relaxed whitespace-pre-line mb-4">{popup.finePrint}</p>
                )}
                <div className="text-center">
                    <button
                        onClick={onClose}
                        className="text-[#59637E]/70 hover:text-[#59637E] text-sm underline focus:outline-none focus:ring-2 focus:ring-[#8A6A5B]/50 rounded px-2 py-1"
                    >
                        Maybe later
                    </button>
                </div>
            </div>
        </div>
    );
}
