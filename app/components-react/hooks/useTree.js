export function useTree(onlyLeaves) {
    function treeSort(info, state) {
        const dropKey = info.node.key;
        const dragKey = info.dragNode.key;
        const dropPos = info.node.pos.split('-');
        const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
        const loop = (data, key, callback) => {
            for (let i = 0; i < data.length; i++) {
                if (data[i].key === key) {
                    return callback(data[i], i, data);
                }
                if (data[i].children)
                    loop(data[i].children, key, callback);
            }
        };
        const data = [...state];
        let dragObj;
        loop(data, dragKey, (item, index, arr) => {
            arr.splice(index, 1);
            dragObj = item;
        });
        if (!info.dropToGap && !onlyLeaves) {
            loop(data, dropKey, (item) => {
                item.children = item.children || [];
                item.children.unshift(dragObj);
            });
        }
        else if ((info.node.children || []).length > 0 &&
            info.node.expanded &&
            dropPosition === 1 &&
            !onlyLeaves) {
            loop(data, dropKey, (item) => {
                item.children = item.children || [];
                item.children.unshift(dragObj);
            });
        }
        else {
            let ar = [];
            let i = 0;
            loop(data, dropKey, (item, index, arr) => {
                ar = arr;
                i = index;
            });
            if (dropPosition === -1) {
                ar.splice(i, 0, dragObj);
            }
            else {
                ar.splice(i + 1, 0, dragObj);
            }
        }
        return data;
    }
    return { treeSort };
}
//# sourceMappingURL=useTree.js.map