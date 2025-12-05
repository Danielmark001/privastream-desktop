var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import path from 'path';
import moment from 'moment';
import { Inject, mutation, PersistentStatefulService, ViewHandler } from 'services/core';
import { $t } from './i18n';
import { ENotificationType } from './notifications';
class MarkersServiceViews extends ViewHandler {
    getLabel(id) {
        if (!this.state)
            return id;
        return this.state[id];
    }
}
export class MarkersService extends PersistentStatefulService {
    constructor() {
        super(...arguments);
        this.markers = {};
    }
    get views() {
        return new MarkersServiceViews(this.state);
    }
    get hasMarkers() {
        return Object.keys(this.markers).length > 0;
    }
    addMarker(id) {
        if (!this.streamingService.views.isRecording)
            return;
        const label = this.views.getLabel(id);
        const timestamp = this.streamingService.formattedDurationInCurrentRecordingState;
        this.markers[timestamp] = label;
        this.notificationsService.push({
            type: ENotificationType.SUCCESS,
            message: $t('Marker %{label} added at %{timestamp}', { label, timestamp }),
            lifeTime: 1000,
        });
        this.usageStatisticsService.recordFeatureUsage('Markers');
    }
    get tableHeader() {
        return 'No,Timecode In,Timecode Out,Timecode Length,Frame In,Frame Out,Frame Length,Name,Comment,Color,\n';
    }
    get tableContents() {
        const markers = Object.keys(this.markers).sort((a, b) => (a < b ? -1 : 0));
        return markers.map((marker, i) => this.prepareRow(marker, i + 1)).join('\n');
    }
    prepareRow(timestamp, number) {
        const label = this.markers[timestamp];
        return `${number},${timestamp}:00,${timestamp}:01,,,,0,"","${label}",blue,`;
    }
    exportCsv(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.hasMarkers)
                return;
            const parsedFilename = path.parse(filename);
            const directory = path.join(parsedFilename.dir, parsedFilename.name);
            const content = this.tableHeader + this.tableContents;
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const fileBuffer = Buffer.from(yield blob.arrayBuffer());
            fs.writeFile(`${directory}_markers.csv`, fileBuffer, () => {
                this.markers = {};
            });
        });
    }
    parseCSV(filepath) {
        const bookmarksArray = [];
        return new Promise((resolve, reject) => {
            const stream = fs.createReadStream(filepath, 'utf8');
            stream.on('data', (data) => {
                data.split('\n').forEach(row => {
                    if (/Timecode In,Timecode Out/.test(row))
                        return;
                    const els = row.split(',');
                    const timestampArr = els[1].split(':');
                    timestampArr.pop();
                    const ms = moment.duration(timestampArr.join(':')).asMilliseconds();
                    bookmarksArray.push({
                        text: els[8],
                        starts_at: ms,
                    });
                });
            });
            stream.on('error', err => reject(err));
            stream.on('close', () => resolve(bookmarksArray));
        });
    }
    setMarkerName(marker, value) {
        this.SET_MARKER_NAME(marker, value);
    }
    SET_MARKER_NAME(marker, value) {
        this.state[marker] = value;
    }
}
MarkersService.defaultState = {
    MARKER_1: 'Marker 1',
    MARKER_2: 'Marker 2',
    MARKER_3: 'Marker 3',
    MARKER_4: 'Marker 4',
};
__decorate([
    Inject()
], MarkersService.prototype, "streamingService", void 0);
__decorate([
    Inject()
], MarkersService.prototype, "notificationsService", void 0);
__decorate([
    Inject()
], MarkersService.prototype, "usageStatisticsService", void 0);
__decorate([
    mutation()
], MarkersService.prototype, "SET_MARKER_NAME", null);
//# sourceMappingURL=markers.js.map