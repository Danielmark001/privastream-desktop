import http from 'http';
import handler from 'serve-handler';
export class DevServer {
    constructor(directory, port = 8081) {
        this.directory = directory;
        this.port = port;
        this.listen();
    }
    listen() {
        this.server = http.createServer((request, response) => handler(request, response, {
            public: this.directory,
            cleanUrls: false,
            headers: [
                {
                    source: '**',
                    headers: [
                        {
                            key: 'Cache-Control',
                            value: 'no-cache, no-store, must-revalidate',
                        },
                    ],
                },
            ],
        }));
        this.server.listen(this.port);
    }
    stopListening() {
        this.server.close();
    }
}
//# sourceMappingURL=dev-server.js.map