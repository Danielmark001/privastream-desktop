var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { formMetadata, metadata } from 'components/shared/inputs/index';
import { $t } from 'services/i18n';
import { BaseGoalService } from './base-goal';
import { InheritMutations } from 'services/core/stateful-service';
let GenericGoalService = class GenericGoalService extends BaseGoalService {
    getMetadata() {
        return formMetadata({
            title: metadata.text({
                title: $t('Title'),
                required: true,
                max: 60,
            }),
            goal_amount: metadata.number({
                title: $t('Goal Amount'),
                required: true,
                min: 1,
            }),
            manual_goal_amount: metadata.number({
                title: $t('Starting Amount'),
                min: 0,
            }),
            ends_at: metadata.text({
                title: $t('End After'),
                required: true,
                dateFormat: 'MM/dd/yyyy',
                placeholder: 'MM/DD/YYYY',
            }),
            include_resubs: metadata.toggle({ title: $t('Include resubs?') }),
            layout: metadata.list({
                title: $t('Layout'),
                options: [
                    { title: 'Standard', value: 'standard' },
                    { title: 'Condensed', value: 'condensed' },
                ],
            }),
            background_color: metadata.color({
                title: $t('Background Color'),
            }),
            bar_color: metadata.color({
                title: $t('Bar Color'),
            }),
            bar_bg_color: metadata.color({
                title: $t('Bar Background Color'),
            }),
            text_color: metadata.color({
                title: $t('Text Color'),
                tooltip: $t('A hex code for the base text color.'),
            }),
            bar_text_color: metadata.color({
                title: $t('Bar Text Color'),
            }),
            bar_thickness: metadata.slider({
                title: $t('Bar Thickness'),
                min: 32,
                max: 128,
                interval: 4,
            }),
            font: metadata.fontFamily({
                title: $t('Font Family'),
            }),
        });
    }
    patchAfterFetch(data) {
        if (Array.isArray(data.goal))
            data.goal = null;
        return data;
    }
};
GenericGoalService = __decorate([
    InheritMutations()
], GenericGoalService);
export { GenericGoalService };
//# sourceMappingURL=generic-goal.js.map