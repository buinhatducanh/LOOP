"use client";

import Script from "next/script";

export function TawktoChat() {
    const propertyId = "69b41637063f791c37e4d891";
    const widgetId = "1jjjndita";

    return (
        <Script id="tawk-widget" strategy="lazyOnload">
            {`
        var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
        (function(){
        var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
        s1.async=true;
        s1.src='https://embed.tawk.to/${propertyId}/${widgetId}';
        s1.charset='UTF-8';
        s1.setAttribute('crossorigin','*');
        s0.parentNode.insertBefore(s1,s0);
        })();
      `}
        </Script>
    );
}
