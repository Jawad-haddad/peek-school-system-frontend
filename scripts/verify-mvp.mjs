import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001';
const EVIDENCE_FILE = 'mvp-evidence.json';

const CREDENTIALS = {
    ADMIN: { email: 'admin@peek.com', password: 'password123' },
    TEACHER: { email: 'teacher@peek.com', password: 'password123' },
    PARENT: { email: 'parent@peek.com', password: 'password123' },
};

const evidence = {};

async function run() {
    console.log('🚀 Starting MVP Runtime Verification');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Route browser console logs to Node.js terminal
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Network Interception
    page.on('response', async (response) => {
        const url = response.url();
        if (!url.includes('/api/')) return;

        const request = response.request();
        const method = request.method();

        try {
            const reqBody = request.postData() ? JSON.parse(request.postData()) : null;
            const resBody = await response.json().catch(() => null);

            const payload = {
                url: url.replace(BASE_URL, ''),
                method,
                status: response.status(),
                request: reqBody,
                response: resBody
            };

            if (url.includes('/auth/login')) {
                if (reqBody?.email === CREDENTIALS.ADMIN.email) evidence.loginAdmin = payload;
                if (reqBody?.email === CREDENTIALS.TEACHER.email) evidence.loginTeacher = payload;
                if (reqBody?.email === CREDENTIALS.PARENT.email) evidence.loginParent = payload;
            }

            if (url.includes('/school/classes')) {
                if (method === 'GET') evidence.classesList = payload;
                if (method === 'POST') evidence.classCreate = payload;
                if (method === 'PUT') evidence.classUpdate = payload;
                if (method === 'DELETE' && !evidence.classDelete) evidence.classDelete = payload;
            }

            if (url.includes('/academics/classes') && url.includes('/students') && method === 'GET') {
                evidence.attendanceStudents = payload;
            }
            if (url.includes('/attendance/bulk') && method === 'POST') {
                evidence.attendanceSubmit = payload;
            }

            if (response.status() === 403) {
                evidence.forbiddenMutation = payload;
            }

        } catch (err) { }
    });

    // Flow 1: PARENT
    console.log('Testing PARENT flow...');
    await page.goto(BASE_URL);
    await page.fill('input[id="email"]', CREDENTIALS.PARENT.email);
    await page.fill('input[id="password"]', CREDENTIALS.PARENT.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    evidence.dashboardParent = page.url();

    // Test PARENT forbidden access
    await page.evaluate(async () => {
        const token = localStorage.getItem('token');
        await fetch('/api/school/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: 'Hacked Class', academicYearId: '1' })
        });
    });
    await page.waitForTimeout(1000);

    // Flow 2: TEACHER
    console.log('Testing TEACHER flow...');
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL);
    await page.fill('input[id="email"]', CREDENTIALS.TEACHER.email);
    await page.fill('input[id="password"]', CREDENTIALS.TEACHER.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    evidence.dashboardTeacher = page.url();

    // Execute Attendance Flow explicitly
    await page.evaluate(async () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        console.log("Teacher User ID:", user.id);

        // 1. Get Teacher Classes
        const classes = await fetch(`/api/academics/teachers/${user.id}/classes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());

        if (classes && classes.length > 0) {
            const classId = classes[0].class.id;
            console.log("Fetching students for class ID:", classId);
            // 2. Load Students
            const students = await fetch(`/api/academics/classes/${classId}/students`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json());

            if (students && students.length > 0) {
                console.log("Submitting bulk attendance for students:", students.length);
                // 3. Submit Attendance
                await fetch('/api/attendance/bulk', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({
                        classId,
                        date: new Date().toISOString().split('T')[0],
                        records: [{ studentId: students[0].id, status: 'present' }]
                    })
                });
            } else {
                console.warn("No students returned from API for class:", classId);
            }
        } else {
            console.warn("No classes assigned to this teacher.");
        }
    });
    await page.waitForTimeout(2000);

    // Flow 3: ADMIN
    console.log('Testing ADMIN flow...');
    await page.evaluate(() => localStorage.clear());
    await page.goto(BASE_URL);
    await page.fill('input[id="email"]', CREDENTIALS.ADMIN.email);
    await page.fill('input[id="password"]', CREDENTIALS.ADMIN.password);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    evidence.dashboardAdmin = page.url();

    await page.evaluate(async () => {
        const token = localStorage.getItem('token');

        // Get academic year
        const ayRes = await fetch('/api/academic-years', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());

        const ayId = ayRes && ayRes.length > 0 ? ayRes[0].id : null;

        if (ayId) {
            // Create class
            const createRes = await fetch('/api/school/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: 'Verification Class', academicYearId: ayId, defaultFee: 500 })
            }).then(r => r.json());

            if (createRes.id) {
                // Update
                await fetch(`/api/school/classes/${createRes.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ name: 'Verification Class Updated', academicYearId: ayId })
                });
                // Delete
                await fetch(`/api/school/classes/${createRes.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        }
    });
    await page.waitForTimeout(3000);

    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2));
    console.log(`✅ Evidence saved to ${EVIDENCE_FILE}`);
    await browser.close();
}

run().catch(console.error);
