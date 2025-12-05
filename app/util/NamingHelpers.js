export default {
    suggestName(name, isTaken) {
        if (isTaken(name)) {
            const match = name.match(/.*\(([0-9]+)\)$/);
            if (match) {
                const num = parseInt(match[1], 10);
                return this.suggestName(name.replace(/(.*\()([0-9]+)(\))$/, `$1${num + 1}$3`), isTaken);
            }
            return this.suggestName(`${name} (1)`, isTaken);
        }
        return name;
    },
};
//# sourceMappingURL=NamingHelpers.js.map