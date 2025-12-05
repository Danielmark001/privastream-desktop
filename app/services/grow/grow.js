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
import Vue from 'vue';
import uuid from 'uuid/v4';
import { StatefulService, mutation, ViewHandler, Inject } from 'services/core';
import { jfetch, authorizedHeaders } from 'util/requests';
import { GOAL_OPTIONS, GROWTH_TIPS } from './grow-data';
import moment from 'moment';
const ONE_WEEK = 6.048e8;
class GrowServiceViews extends ViewHandler {
    get platformOptions() {
        return [{ icon: 'twitch' }, { icon: 'youtube' }, { icon: 'facebook' }];
    }
    get goals() {
        return this.state.goals;
    }
    get platformsToMap() {
        return this.state.communityReach.concat(this.platformOptions.filter(p => !this.state.communityReach.find(r => r.icon === p.icon)));
    }
    get analytics() {
        return this.state.analytics;
    }
    get universityProgress() {
        return this.state.universityProgress;
    }
    get goalOptions() {
        return GOAL_OPTIONS();
    }
    get tips() {
        return GROWTH_TIPS();
    }
    goalExpiredOrComplete(goal) {
        if (goal.progress === goal.total)
            return true;
        if (this.timeLeft(goal) <= 0)
            return true;
        return false;
    }
    timeLeft(goal) {
        if (!goal.startDate)
            return Infinity;
        if (/week/.test(goal.type))
            return moment(goal.startDate).valueOf() + ONE_WEEK - Date.now();
        if (/month/.test(goal.type)) {
            return moment(goal.startDate).valueOf() + ONE_WEEK * 4 - Date.now();
        }
        return Infinity;
    }
}
export class GrowService extends StatefulService {
    SET_ANALYTICS(analytics) {
        this.state.analytics = analytics;
    }
    SET_UNIVERSITY_PROGRESS(progress) {
        this.state.universityProgress = progress;
    }
    SET_COMMUNITY_REACH(communityReach) {
        this.state.communityReach = communityReach;
    }
    ADD_GOAL(goal) {
        Vue.set(this.state.goals, goal.type, goal);
    }
    REMOVE_GOAL(goal) {
        Vue.delete(this.state.goals, goal.type);
    }
    SET_GOAL(goal) {
        Vue.set(this.state.goals, goal.type, goal);
    }
    init() {
        super.init();
        this.userService.userLogin.subscribe(() => {
            this.fetchGoals();
            this.fetchAnalytics();
            this.fetchUniversityProgress();
            this.fetchPlatformFollowers();
        });
    }
    formGoalRequest(method = 'GET', body) {
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/growth/goal`;
        const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
        return new Request(url, { headers, method, body: body ? JSON.stringify(body) : undefined });
    }
    fetchGoals() {
        jfetch(this.formGoalRequest()).then(json => json.forEach(goal => {
            this.ADD_GOAL(Object.assign({ startDate: goal.start_date }, goal));
        }));
    }
    fetchAnalytics() {
        const url = `https://${this.hostsService.streamlabs}/api/v5/slobs/dashboard-analytics`;
        const headers = authorizedHeaders(this.userService.apiToken, new Headers({ 'Content-Type': 'application/json' }));
        const request = new Request(url, { headers });
        jfetch(request).then(json => this.SET_ANALYTICS(json));
    }
    fetchPlatformFollowers() {
        return __awaiter(this, void 0, void 0, function* () {
            const platforms = this.userService.views.platforms;
            const platformService = {
                twitch: this.twitchService,
                facebook: this.facebookService,
                youtube: this.youtubeService,
                trovo: this.trovoService,
            };
            const communityReach = [];
            yield Promise.all(Object.keys(platforms)
                .filter(platform => platform !== 'tiktok')
                .map((platform) => __awaiter(this, void 0, void 0, function* () {
                const followers = yield platformService[platform].fetchFollowers();
                communityReach.push({ icon: platform, followers });
            })));
            this.SET_COMMUNITY_REACH(communityReach);
        });
    }
    fetchUniversityProgress() {
        if (!this.userService.isLoggedIn)
            return;
        const url = `https://${this.hostsService.streamlabs}/university/api/user/info/${this.userService.widgetToken}`;
        const req = new Request(url);
        jfetch(req).then(json => this.SET_UNIVERSITY_PROGRESS(json.user));
    }
    get views() {
        return new GrowServiceViews(this.state);
    }
    addGoal(goal) {
        const goalWithType = Object.assign(Object.assign({}, goal), { progress: 0, startDate: moment().format('YYYY-MM-DD HH:mm:ss'), type: goal.type === 'custom' ? uuid() : goal.type });
        jfetch(this.formGoalRequest('POST', goalWithType)).then(goalResponse => {
            this.ADD_GOAL(goalResponse);
        });
    }
    incrementGoal(goalId, amount) {
        const goal = this.state.goals[goalId];
        if (!goal || this.views.goalExpiredOrComplete(goal))
            return;
        const newProgress = amount + goal.progress;
        jfetch(this.formGoalRequest('PUT', Object.assign(Object.assign({}, goal), { progress: newProgress })));
        this.SET_GOAL(Object.assign(Object.assign({}, goal), { progress: newProgress }));
    }
    removeGoal(goal) {
        jfetch(this.formGoalRequest('DELETE', { id: goal.id }));
        this.REMOVE_GOAL(goal);
    }
    clearCompletedGoals() {
        Object.values(this.state.goals).forEach(goal => {
            if (goal.progress === goal.total) {
                this.removeGoal(goal);
            }
        });
    }
}
GrowService.initialState = {
    goals: {},
    analytics: {},
    universityProgress: {},
    communityReach: [],
};
__decorate([
    Inject()
], GrowService.prototype, "userService", void 0);
__decorate([
    Inject()
], GrowService.prototype, "hostsService", void 0);
__decorate([
    Inject()
], GrowService.prototype, "twitchService", void 0);
__decorate([
    Inject()
], GrowService.prototype, "youtubeService", void 0);
__decorate([
    Inject()
], GrowService.prototype, "facebookService", void 0);
__decorate([
    Inject()
], GrowService.prototype, "trovoService", void 0);
__decorate([
    mutation()
], GrowService.prototype, "SET_ANALYTICS", null);
__decorate([
    mutation()
], GrowService.prototype, "SET_UNIVERSITY_PROGRESS", null);
__decorate([
    mutation()
], GrowService.prototype, "SET_COMMUNITY_REACH", null);
__decorate([
    mutation()
], GrowService.prototype, "ADD_GOAL", null);
__decorate([
    mutation()
], GrowService.prototype, "REMOVE_GOAL", null);
__decorate([
    mutation()
], GrowService.prototype, "SET_GOAL", null);
//# sourceMappingURL=grow.js.map