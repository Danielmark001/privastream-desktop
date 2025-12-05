export class Node {
    migrate(version) {
    }
    toJSON() {
        return Object.assign({
            schemaVersion: this.schemaVersion,
            nodeType: this.constructor.name,
        }, this.data);
    }
    fromJSON(obj) {
        const clone = Object.assign({}, obj);
        const version = clone.schemaVersion;
        delete clone.schemaVersion;
        delete clone.nodeType;
        this.data = clone;
        this.migrate(version);
    }
}
//# sourceMappingURL=node.js.map