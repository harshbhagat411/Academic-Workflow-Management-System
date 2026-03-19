const generatePassword = (loginId, role) => {
    const idSuffix = loginId.slice(-3); // Extract last 3 digits
    if (role === 'Student') {
        return `STU${idSuffix}`;
    } else if (role === 'Faculty') {
        return `FAC${idSuffix}`;
    } else {
        return `PASS${idSuffix}`;
    }
};

const tests = [
    { id: 'ST2026S019', role: 'Student', expected: 'STU019' },
    { id: 'ST2026S002', role: 'Student', expected: 'STU002' },
    { id: 'ST2026S120', role: 'Student', expected: 'STU120' },
    { id: 'FC2026S012', role: 'Faculty', expected: 'FAC012' },
    { id: 'FC2026S002', role: 'Faculty', expected: 'FAC002' },
    { id: 'FC2026S120', role: 'Faculty', expected: 'FAC120' },
];

console.log("Running Password Generation Tests...");
let passed = 0;
tests.forEach(test => {
    const result = generatePassword(test.id, test.role);
    if (result === test.expected) {
        console.log(`PASS: ${test.id} (${test.role}) -> ${result}`);
        passed++;
    } else {
        console.error(`FAIL: ${test.id} (${test.role}) -> Expected ${test.expected}, got ${result}`);
    }
});

if (passed === tests.length) {
    console.log("\nAll tests passed successfully!");
} else {
    console.log(`\n${tests.length - passed} tests failed.`);
    process.exit(1);
}
