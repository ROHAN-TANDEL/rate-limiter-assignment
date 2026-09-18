const URL = "http://localhost:3000/bar";
const CLIENT_TOKEN = "bearer client-1";
const TOTAL_CONCURRENT = 20;

async function fire() {
    const requests = Array.from({ length: TOTAL_CONCURRENT }, async (_, idx) => {
        const res = await fetch(URL, {
            headers: { Authorization: CLIENT_TOKEN },
        });
        return res.status;
    });

    const statuses = await Promise.all(requests);

    const summary = statuses.reduce((acc, code) => {
        acc[code] = (acc[code] || 0) + 1;
        return acc;
    }, {});

    console.log("Results from concurrent burst:");
    console.table(summary);
}

fire();