import { CombinableCommand } from './combinable-command';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
export class ModifyTransformCommand extends CombinableCommand {
    constructor(selection, display) {
        super();
        this.selection = selection;
        this.display = display;
        this.startTransforms = {};
        this.modifyTransformSubCommands = [];
        this.selection.freeze();
        this.selection.getItems(this.display).forEach(item => {
            this.startTransforms[item.id] = cloneDeep(item.state.transform);
        });
    }
    execute() {
        if (this.endTransforms) {
            this.selection.getItems(this.display).forEach(item => {
                item.setTransform(this.endTransforms[item.id]);
            });
        }
        else {
            this.modifyTransform();
            this.endTransforms = {};
            this.selection.getItems(this.display).forEach(item => {
                this.endTransforms[item.id] = cloneDeep(item.state.transform);
            });
        }
    }
    rollback() {
        this.selection.getItems(this.display).forEach(item => {
            item.setTransform(this.startTransforms[item.id]);
        });
        this.modifyTransformSubCommands.forEach(cmd => cmd.rollback());
    }
    shouldCombine(other) {
        return (other.selection.sceneId === this.selection.sceneId &&
            isEqual(other.selection.getIds(), this.selection.getIds()));
    }
    combine(other) {
        this.endTransforms = other.endTransforms;
    }
}
//# sourceMappingURL=modify-transform.js.map