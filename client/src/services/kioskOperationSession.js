// Track only the operation opened by this kiosk page. Other students' work
// must remain untouched when this page is cancelled or leaves the ballot.
export const createKioskOperationSession = ({ abort, finish }) => {
    let operationId = null;
    let completed = false;
    let releasing = null;

    return {
        get id() { return operationId; },
        track(id) {
            if (!id || id === operationId) return;
            operationId = id;
            completed = false;
        },
        markCompleted() { completed = true; },
        release() {
            if (releasing) return releasing;
            if (!operationId) return Promise.resolve();
            const releasingId = operationId;
            const request = completed ? finish : abort;
            releasing = Promise.resolve()
                .then(() => request(releasingId))
                .then(() => {
                    if (operationId === releasingId) {
                        operationId = null;
                        completed = false;
                    }
                })
                .finally(() => { releasing = null; });
            return releasing;
        },
    };
};
