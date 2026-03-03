import fs from 'fs';
import path from 'path';

const apiPath = path.join(process.cwd(), 'src', 'lib', 'api.ts');
let content = fs.readFileSync(apiPath, 'utf8');

const importToast = "import { toast } from '@/lib/toast-events';";
const formatApiErrorBlock = `

export function formatApiError(prefix: string, error: any, defaultMsg: string = 'Unknown error'): string {
    let msg = defaultMsg;
    
    if (error && typeof error === 'object' && error.name === 'ApiEnvelopeError') {
        msg = error.message;
        if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details) && error.details.length > 0) {
            msg = error.details[0].message || error.details[0].string || Object.values(error.details[0])[0] || msg;
        }
    } else if (error?.response?.data?.message) {
        msg = error.response.data.message;
    } else if (!error?.response && error?.message?.includes('Network Error')) {
        msg = 'Network Error: The server is unreachable.';
    } else if (error?.message) {
        msg = error.message;
    }

    const reqId = error?.requestId || error?.config?.headers?.['X-Request-Id'] || error?.response?.headers?.['x-request-id'];

    if (process.env.NODE_ENV !== 'production' && reqId) {
        return \`\${prefix}: \${msg} (Request ID: \${reqId})\`;
    }
    
    return \`\${prefix}: \${msg}\`;
}`;

if (!content.includes('export function formatApiError')) {
    content = content.replace(importToast, importToast + formatApiErrorBlock);
}

// Remove safeErrorMsg entirely
content = content.replace(/\/\*\* Internal error normaliser.*?const safeErrorMsg = [\s\S]*?};\n\n/g, '');

// Process posApi manually
const posBlock = `let msg = error.message || 'Unknown error';
            if (error.code === 'VALIDATION_ERROR' && Array.isArray(error.details) && error.details.length > 0) {
                msg = error.details[0].message || error.details[0].string || Object.values(error.details[0])[0] || msg;
            }
            toast.error("Order failed: " + msg);`;
content = content.replace(posBlock, 'toast.error(formatApiError("Order failed", error));');

// Helper to remove any explicit ApiError casting lines in mvpApi
content = content.replace(/const e = error as ApiError;\s*/g, '');

// Fix toast.error("Some Message: " + safeErrorMsg(e, ...))
content = content.replace(/toast\.error\("([^"]+?):\s*"\s*\+\s*safeErrorMsg\([^)]+\)\);/g, 'toast.error(formatApiError("$1", error));');

// Fix standard toast.error("Message: " + (error.something))
content = content.replace(/toast\.error\("([^"]+?):\s*"\s*\+\s*\([^)]+\)\);/g, 'toast.error(formatApiError("$1", error));');

// Fix standard toast.error('Message: ' + (error.something)) -> with single quotes
content = content.replace(/toast\.error\('([^']+?):\s*'\s*\+\s*\([^)]+\)\);/g, 'toast.error(formatApiError("$1", error));');

// Edgecase: toast.error("Failed to delete schedule");
content = content.replace(/toast\.error\("Failed to delete schedule"\);/g, 'toast.error(formatApiError("Failed to delete schedule", error));');

fs.writeFileSync(apiPath, content);
console.log('Successfully refactored api.ts error patterns!');
