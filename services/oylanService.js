const https = require('https');

const BASE_HOST = 'oylan.nu.edu.kz';
const BASE_PATH = '/api/v1';

function request(method, path, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : null;

        const options = {
            hostname: BASE_HOST,
            path: BASE_PATH + path,
            method,
            headers: {
                'Authorization': `Api-Key ${process.env.OYLAN_API_KEY}`,
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(data);
        }

        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(raw));
                } catch {
                    resolve(raw);
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

// Interactions endpoint requires multipart/form-data (not JSON)
function requestFormData(method, path, fields) {
    return new Promise((resolve, reject) => {
        const boundary = '----BilimHubBoundary' + Date.now();

        const parts = Object.entries(fields).map(([name, value]) =>
            `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`
        );
        const body = parts.join('\r\n') + `\r\n--${boundary}--\r\n`;
        const bodyBuffer = Buffer.from(body, 'utf8');

        const options = {
            hostname: BASE_HOST,
            path: BASE_PATH + path,
            method,
            headers: {
                'Authorization': `Api-Key ${process.env.OYLAN_API_KEY}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': bodyBuffer.length,
            }
        };

        const req = https.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(raw));
                } catch {
                    resolve(raw);
                }
            });
        });

        req.on('error', reject);
        req.write(bodyBuffer);
        req.end();
    });
}

exports.createAssistant = async (name, instructions) => {
    try {
        return await request('POST', '/assistant/', {
            name,
            instructions,
            model: 'Oylan'
        });
    } catch (err) {
        console.error('Oylan createAssistant error:', err);
        return null;
    }
};

exports.sendMessage = async (assistantId, userMessage, contextData) => {
    try {
        // API requires multipart/form-data with field "content"
        // Context is prepended to the user's question since there is no separate context field
        const content = [
            `[Context]`,
            `Topic: ${contextData.theme_title}`,
            `Lecture: ${contextData.lecture_title}`,
            `Lecture summary: ${contextData.lecture_content}`,
            ``,
            `[Question]`,
            userMessage
        ].join('\n');

        return await requestFormData('POST', `/assistant/${assistantId}/interactions/`, { content });
    } catch (err) {
        console.error('Oylan sendMessage error:', err);
        return null;
    }
};

exports.getModels = async () => {
    try {
        return await request('GET', '/assistant/models/');
    } catch (err) {
        console.error('Oylan getModels error:', err);
        return null;
    }
};
