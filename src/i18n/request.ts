import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that a valid locale is used
    if (!locale || !routing.locales.includes(locale as any)) {
        locale = routing.defaultLocale;
    }

    try {
        return {
            locale,
            messages: (await import(`../../messages/${locale}.json`)).default
        };
    } catch (error) {
        // Fallback to English if locale file fails to load
        return {
            locale,
            messages: (await import(`../../messages/en.json`)).default
        };
    }
});
