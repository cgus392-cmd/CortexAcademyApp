/**
 * Cortex Industrial Diagnostic Logger (Mobile)
 * Captura la actividad de la terminal para reportes de diagnóstico.
 */

class Logger {
    private static instance: Logger;
    private logs: string[] = [];
    private maxLogs: number = 50; // Reducido para mayor velocidad
    private originalConsole: any = {};
    private isLogging: boolean = false; // Flag anti-recursión

    private constructor() {}

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public init() {
        if (Object.keys(this.originalConsole).length > 0) return;

        const consoleMethods: (keyof Console)[] = ['log', 'warn', 'error', 'info'];
        
        consoleMethods.forEach((method) => {
            if (typeof console[method] === 'function') {
                this.originalConsole[method] = console[method];
                
                (console as any)[method] = (...args: any[]) => {
                    // Preservar funcionalidad original
                    this.originalConsole[method].apply(console, args);
                    
                    // Capturar para diagnóstico con protección
                    if (!this.isLogging) {
                        this.isLogging = true;
                        try {
                            this.addLog(method.toUpperCase(), args);
                        } finally {
                            this.isLogging = false;
                        }
                    }
                };
            }
        });
        
        console.log("🛡️ [Cortex Diagnostic] Motor de logs activo.");
    }

    private addLog(level: string, args: any[]) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    // Solo los primeros 100 caracteres del JSON para evitar objetos gigantes
                    return JSON.stringify(arg).substring(0, 100);
                } catch (e) {
                    return '[Object]';
                }
            }
            return String(arg).substring(0, 150); // Límite de caracteres por línea
        }).join(' ');
        
        const entry = `[${timestamp}] [${level}] ${message}`;
        this.logs.push(entry);
        
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    public getLogs(): string[] {
        return [...this.logs];
    }

    public clear() {
        this.logs = [];
    }
}

export default Logger.getInstance();
