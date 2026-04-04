// 🏛️ CORTEX UNIVERSITY ENGINE - MOBILE ADAPTATION
// Ported from CortexWebOS 3.1
// Purpose: Reliable University Recognition & Branding

import { generateText } from "./gemini";

export interface UniversityMatch {
    name: string;
    domain: string;
    country: string;
    logo: string;
    color: string;
}

const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * 🛡️ SAFE LOGO GENERATOR
 * Using Google S2 for maximum reliability.
 */
export const getUniversityLogo = (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;

// --- BASE DE DATOS LOCAL (FASTER) ---
const MASTER_DB = [
    { n: "Universidad Nacional de Colombia", d: "unal.edu.co", c: "#000000", a: ["unal", "nacional", "bogota", "medellin"] },
    { n: "Universidad de los Andes", d: "uniandes.edu.co", c: "#FFD700", a: ["andes", "uniandes"] },
    { n: "Pontificia Universidad Javeriana", d: "javeriana.edu.co", c: "#004B87", a: ["puj", "javeriana"] },
    { n: "Universidad de Antioquia", d: "udea.edu.co", c: "#006633", a: ["udea", "antioquia"] },
    { n: "Universidad del Norte", d: "uninorte.edu.co", c: "#E30613", a: ["uninorte", "norte"] },
    { n: "Universidad Simón Bolívar", d: "unisimon.edu.co", c: "#003366", a: ["unisimon", "simon bolivar", "usb"] },
    { n: "Universidad del Atlántico", d: "uniatlantico.edu.co", c: "#007A33", a: ["uniatlantico", "atlantico"] },
    { n: "Corporación Universitaria Reformada", d: "unireformada.edu.co", c: "#8B0000", a: ["cur", "reformada"] },
    { n: "Universidad EAFIT", d: "eafit.edu.co", c: "#003366", a: ["eafit"] },
    { n: "Universidad de la Costa", d: "cuc.edu.co", c: "#C8102E", a: ["cuc", "costa"] },
    { n: "UNAM", d: "unam.mx", c: "#002B7A", a: ["nacional", "mexico"] },
    { n: "Tecnológico de Monterrey", d: "tec.mx", c: "#0033A0", a: ["tec", "monterrey"] },
    { n: "Harvard University", d: "harvard.edu", c: "#A51C30", a: ["harvard"] },
    { n: "MIT", d: "mit.edu", c: "#A31F34", a: ["mit"] }
];

/**
 * Find university in Local DB or via domain pattern.
 */
export const findUniversityDomain = (query: string): UniversityMatch | null => {
    if (!query || query.length < 3) return null;
    
    const cleanQuery = normalize(query);
    
    // 1. Direct Domain Detection
    if (cleanQuery.includes('.') && !cleanQuery.includes(' ')) {
        const domain = cleanQuery.replace(/^https?:\/\//, '').replace(/\/$/, '');
        return {
            name: domain,
            domain: domain,
            country: "Web",
            logo: getUniversityLogo(domain),
            color: "#6366F1" // Default Indigo
        };
    }

    // 2. Local DB Search
    const match = MASTER_DB.find(uni => {
        const nameMatch = normalize(uni.n).includes(cleanQuery);
        const aliasMatch = uni.a.some(alias => normalize(alias).includes(cleanQuery));
        return nameMatch || aliasMatch;
    });

    if (match) {
        return {
            name: match.n,
            domain: match.d,
            country: "Colombia",
            logo: getUniversityLogo(match.d),
            color: match.c || "#6366F1"
        };
    }

    return null;
};

/**
 * AI-Powered Domain Lookup (Mirrors CortexWebOS)
 * Only if the user explicitly types a complex query.
 */
export const findUniversityWithAI = async (query: string): Promise<UniversityMatch | null> => {
    try {
        const prompt = `Find the official education domain for: "${query}". Return ONLY a JSON object with this format: {"name": "Full Name", "domain": "uni.edu", "country": "Country"}`;
        const responseText = await generateText(prompt, "Eres un buscador de dominios académicos exacto. Responde solo el JSON.");
        
        const json = JSON.parse(responseText.trim());
        if (json && json.domain) {
            return {
                name: json.name,
                domain: json.domain,
                country: json.country,
                logo: getUniversityLogo(json.domain),
                color: "#6366F1"
            };
        }
    } catch (e) {
        console.error("AI Uni Discovery Error:", e);
    }
    return null;
};
