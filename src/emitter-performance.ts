/*
Copyright 2020 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import EventEmitter from "events";

interface IEventEmitterStats {
    emitCount: number;
    emittedAt: DOMHighResTimeStamp[];
    handlerTimeElapsed: number[];
}

const eventToStats: Map<string, IEventEmitterStats> = new Map();

function getEventStats(event: string): IEventEmitterStats {
    let stats = eventToStats.get(event);
    if (!stats) {
        stats = {
            emitCount: 0,
            emittedAt: [],
            handlerTimeElapsed: [],
        };
        eventToStats.set(event, stats);
    }
    return stats;
}

export default class MeasuredEventEmitter extends EventEmitter {
    emit(event: string, ...args: any[]): boolean {
        const stats = getEventStats(event);

        // Capture previous data before collecting this iteration
        // let lastEmittedAt = 0;
        // if (stats.emittedAt.length) {
        //     lastEmittedAt = stats.emittedAt[stats.emittedAt.length - 1];
        // }

        // Collect data for current iteration
        stats.emitCount++;
        const start = window.performance.now();
        stats.emittedAt.push(start);
        const emitted = super.emit(event, ...args);
        const end = window.performance.now();
        const handlerTimeElapsed = end - start;
        stats.handlerTimeElapsed.push(handlerTimeElapsed);

        // Compute stats for event overall
        // const emitCountText = `${stats.emitCount} times`;
        // let lastEmittedText = "last emitted never";
        // if (lastEmittedAt) {
        //     lastEmittedText = `last emitted ${start - lastEmittedAt} ms ago`;
        // }
        // const handlerTimeText = `${handlerTimeElapsed} ms to handle`;
        // console.log(`Emitted ${event}: ${emitCountText}, ${lastEmittedText}, ${handlerTimeText}`);

        return emitted;
    }
}

window.mxLogEventStats = () => {
    const summaryByEvent = {};
    for (const [event, stats] of eventToStats.entries()) {
        const { emitCount, handlerTimeElapsed } = stats;
        const handlerTimeSum = handlerTimeElapsed.reduce((sum, current) => sum + current);
        summaryByEvent[event] = {
            emitCount,
            handlerTimeAvg: handlerTimeSum / emitCount,
            handlerTimeSum,
        };
    }
    console.table(summaryByEvent);
};
