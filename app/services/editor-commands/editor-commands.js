var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { mutation, StatefulService } from 'services/core/stateful-service';
import * as commands from './commands';
import { CombinableCommand } from './commands/combinable-command';
import { shortcut } from 'services/shortcuts';
import { Inject } from 'services/core/injector';
import { ENudgeDirection } from './commands/nudge-items';
import Utils from 'services/utils';
import { BehaviorSubject } from 'rxjs';
import * as remote from '@electron/remote';
const COMMANDS = Object.assign({}, commands);
const COMBINE_TIMEOUT = 500;
const MAX_HISTORY_SIZE = 500;
export class EditorCommandsService extends StatefulService {
    constructor() {
        super(...arguments);
        this.undoHistory = [];
        this.redoHistory = [];
        this.undoHistorySize = new BehaviorSubject({
            undoLength: 0,
            redoLength: 0,
        });
        this.combineActive = false;
    }
    init() {
        this.sceneCollectionsService.collectionWillSwitch.subscribe(() => this.clear());
    }
    setCombineTimeout() {
        this.combineActive = true;
        if (this.combineTimeout)
            clearTimeout(this.combineTimeout);
        this.combineTimeout = window.setTimeout(() => {
            this.combineActive = false;
            this.combineTimeout = null;
        }, COMBINE_TIMEOUT);
    }
    executeCommand(commandType, ...commandArgs) {
        this.redoHistory = [];
        this.updateUndoHistoryLength();
        this.CLEAR_REDO_METADATA();
        const instance = new COMMANDS[commandType](...commandArgs);
        const ret = instance.execute();
        if (ret instanceof Promise) {
            this.SET_OPERATION_IN_PROGRESS(true);
            ret.then(() => this.SET_OPERATION_IN_PROGRESS(false));
        }
        if (instance instanceof CombinableCommand) {
            if (this.combineActive) {
                const previousCommand = this.undoHistory[this.undoHistory.length - 1];
                if (previousCommand.constructor === instance.constructor &&
                    previousCommand instanceof CombinableCommand &&
                    previousCommand.shouldCombine(instance)) {
                    previousCommand.combine(instance);
                    this.setCombineTimeout();
                    return;
                }
            }
            this.setCombineTimeout();
        }
        this.undoHistory.push(instance);
        this.updateUndoHistoryLength();
        this.PUSH_UNDO_METADATA({ description: instance.description });
        if (this.undoHistory.length > MAX_HISTORY_SIZE) {
            this.undoHistory.shift();
            this.updateUndoHistoryLength();
            this.SHIFT_UNDO_METADATA();
        }
        return ret;
    }
    undo() {
        if (this.state.operationInProgress || this.undoHistory.length < 1)
            return;
        this.usageStatisticsService.recordFeatureUsage('Undo');
        const command = this.undoHistory.pop();
        this.updateUndoHistoryLength();
        this.POP_UNDO_METADATA();
        if (command) {
            let ret;
            try {
                ret = command.rollback();
            }
            catch (e) {
                this.handleUndoRedoError(true, e);
                return;
            }
            if (ret instanceof Promise) {
                this.SET_OPERATION_IN_PROGRESS(true);
                ret
                    .then(() => this.SET_OPERATION_IN_PROGRESS(false))
                    .catch(e => {
                    this.SET_OPERATION_IN_PROGRESS(false);
                    this.handleUndoRedoError(true, e);
                });
            }
            this.redoHistory.push(command);
            this.updateUndoHistoryLength();
            this.PUSH_REDO_METADATA({ description: command.description });
        }
    }
    redo() {
        if (this.state.operationInProgress)
            return;
        const command = this.redoHistory.pop();
        this.updateUndoHistoryLength();
        this.POP_REDO_METADATA();
        if (command) {
            let ret;
            try {
                ret = command.execute();
            }
            catch (e) {
                this.handleUndoRedoError(false, e);
                return;
            }
            if (ret instanceof Promise) {
                this.SET_OPERATION_IN_PROGRESS(true);
                ret
                    .then(() => this.SET_OPERATION_IN_PROGRESS(false))
                    .catch(e => {
                    this.SET_OPERATION_IN_PROGRESS(false);
                    this.handleUndoRedoError(false, e);
                });
            }
            this.undoHistory.push(command);
            this.updateUndoHistoryLength();
            this.PUSH_UNDO_METADATA({ description: command.description });
        }
    }
    handleUndoRedoError(undo, e) {
        console.error(`Error performing ${undo ? 'undo' : 'redo'} operation`, e);
        remote.dialog.showMessageBox(Utils.getMainWindow(), {
            title: 'Error',
            message: `An error occurred while ${undo ? 'undoing' : 'redoing'} the operation.`,
            type: 'error',
        });
        this.clear();
    }
    clear() {
        this.undoHistory = [];
        this.redoHistory = [];
        this.updateUndoHistoryLength();
        this.CLEAR_UNDO_METADATA();
        this.CLEAR_REDO_METADATA();
    }
    get nextUndo() {
        return this.state.undoMetadata[this.state.undoMetadata.length - 1];
    }
    get nextUndoDescription() {
        return this.nextUndo ? this.nextUndo.description : '';
    }
    get nextRedo() {
        return this.state.redoMetadata[this.state.redoMetadata.length - 1];
    }
    get nextRedoDescription() {
        return this.nextRedo ? this.nextRedo.description : '';
    }
    nudgeActiveItemsLeft() {
        this.nudgeActiveItems(ENudgeDirection.Left);
    }
    nudgeActiveItemsRight() {
        this.nudgeActiveItems(ENudgeDirection.Right);
    }
    nudgeActiveItemsUp() {
        this.nudgeActiveItems(ENudgeDirection.Up);
    }
    nudgeActiveItemsDown() {
        this.nudgeActiveItems(ENudgeDirection.Down);
    }
    nudgeActiveItems(direction) {
        const selection = this.selectionService.views.globalSelection;
        if (!selection.getNodes().length)
            return;
        if (selection.isAnyLocked())
            return;
        this.executeCommand('NudgeItemsCommand', selection, direction);
    }
    updateUndoHistoryLength() {
        this.undoHistorySize.next({
            undoLength: this.undoHistory.length,
            redoLength: this.redoHistory.length,
        });
    }
    PUSH_UNDO_METADATA(undo) {
        this.state.undoMetadata.push(undo);
    }
    POP_UNDO_METADATA() {
        this.state.undoMetadata.pop();
    }
    CLEAR_UNDO_METADATA() {
        this.state.undoMetadata = [];
    }
    SHIFT_UNDO_METADATA() {
        this.state.undoMetadata.shift();
    }
    PUSH_REDO_METADATA(redo) {
        this.state.redoMetadata.push(redo);
    }
    POP_REDO_METADATA() {
        this.state.redoMetadata.pop();
    }
    CLEAR_REDO_METADATA() {
        this.state.redoMetadata = [];
    }
    SET_OPERATION_IN_PROGRESS(val) {
        this.state.operationInProgress = val;
    }
}
EditorCommandsService.initialState = {
    undoMetadata: [],
    redoMetadata: [],
    operationInProgress: false,
};
__decorate([
    Inject()
], EditorCommandsService.prototype, "selectionService", void 0);
__decorate([
    Inject()
], EditorCommandsService.prototype, "sceneCollectionsService", void 0);
__decorate([
    Inject()
], EditorCommandsService.prototype, "usageStatisticsService", void 0);
__decorate([
    shortcut('Ctrl+Z')
], EditorCommandsService.prototype, "undo", null);
__decorate([
    shortcut('Ctrl+Y')
], EditorCommandsService.prototype, "redo", null);
__decorate([
    shortcut('ArrowLeft')
], EditorCommandsService.prototype, "nudgeActiveItemsLeft", null);
__decorate([
    shortcut('ArrowRight')
], EditorCommandsService.prototype, "nudgeActiveItemsRight", null);
__decorate([
    shortcut('ArrowUp')
], EditorCommandsService.prototype, "nudgeActiveItemsUp", null);
__decorate([
    shortcut('ArrowDown')
], EditorCommandsService.prototype, "nudgeActiveItemsDown", null);
__decorate([
    mutation()
], EditorCommandsService.prototype, "PUSH_UNDO_METADATA", null);
__decorate([
    mutation()
], EditorCommandsService.prototype, "POP_UNDO_METADATA", null);
__decorate([
    mutation()
], EditorCommandsService.prototype, "CLEAR_UNDO_METADATA", null);
__decorate([
    mutation()
], EditorCommandsService.prototype, "SHIFT_UNDO_METADATA", null);
__decorate([
    mutation()
], EditorCommandsService.prototype, "PUSH_REDO_METADATA", null);
__decorate([
    mutation()
], EditorCommandsService.prototype, "POP_REDO_METADATA", null);
__decorate([
    mutation()
], EditorCommandsService.prototype, "CLEAR_REDO_METADATA", null);
__decorate([
    mutation()
], EditorCommandsService.prototype, "SET_OPERATION_IN_PROGRESS", null);
//# sourceMappingURL=editor-commands.js.map