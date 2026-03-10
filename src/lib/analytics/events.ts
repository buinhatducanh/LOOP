export const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", eventName, eventParams);
    } else if (process.env.NODE_ENV !== "production") {
        console.log(`[Analytics Event] ${eventName}`, eventParams);
    }
};

export const trackFormSubmission = (formName: string, service?: string) => {
    trackEvent("form_submission", {
        form_name: formName,
        service_interested: service,
    });
};

export const trackCtaClick = (ctaName: string, destination: string) => {
    trackEvent("cta_click", {
        cta_name: ctaName,
        destination: destination,
    });
};

export const trackLanguageSwitch = (fromLang: string, toLang: string) => {
    trackEvent("language_switch", {
        from_language: fromLang,
        to_language: toLang,
    });
};
