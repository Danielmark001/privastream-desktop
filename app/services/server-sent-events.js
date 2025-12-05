import { Service } from './core/service';
import { Subject } from 'rxjs';
export class SseService extends Service {
    constructor() {
        super(...arguments);
        this.eventSources = new Map();
        this.subjects = new Map();
    }
    open(url = 'http://localhost:8000/events') {
        if (this.subjects.has(url)) {
            return this.subjects.get(url).asObservable();
        }
        const subject = new Subject();
        const eventSource = new EventSource(url);
        eventSource.onmessage = (e) => {
            console.log(`SSE message from ${url}`, e.data);
            subject.next(e);
        };
        eventSource.onerror = (err) => {
            console.error(`SSE error on ${url}`, err);
            subject.error(err);
        };
        this.eventSources.set(url, eventSource);
        this.subjects.set(url, subject);
        return subject.asObservable();
    }
    close(url) {
        if (url) {
            const eventSource = this.eventSources.get(url);
            const subject = this.subjects.get(url);
            if (eventSource) {
                eventSource.close();
                this.eventSources.delete(url);
            }
            if (subject) {
                subject.complete();
                this.subjects.delete(url);
            }
        }
        else {
            for (const [u, eventSource] of this.eventSources) {
                eventSource.close();
            }
            for (const subject of this.subjects.values()) {
                subject.complete();
            }
            this.eventSources.clear();
            this.subjects.clear();
        }
    }
}
//# sourceMappingURL=server-sent-events.js.map