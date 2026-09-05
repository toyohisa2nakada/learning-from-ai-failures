"use client";

import { createContext, useContext, useEffect, useState } from "react";
const TranslationContext = createContext(false);

export default function TranslationProvider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const [translated, setTranslated] = useState(false);
    const checkTranslation = () => {
        const html = document.documentElement;

        const isTranslated =
            html.classList.contains("translated-ltr") ||
            html.classList.contains("translated-rtl");

        setTranslated(isTranslated);
        console.log("translated:", isTranslated);
    };

    useEffect(() => {
        checkTranslation();
        const observer = new MutationObserver(checkTranslation);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <TranslationContext.Provider value={translated}>
            {children}
        </TranslationContext.Provider>
    );
}
export function useTranslation() {
    return useContext(TranslationContext);
}
