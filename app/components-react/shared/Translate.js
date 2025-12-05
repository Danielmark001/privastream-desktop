import { camelize } from 'humps';
import React, { useEffect, useState, createElement } from 'react';
import keyBy from 'lodash/keyBy';
export default function Translate(p) {
    let children = [];
    if (p.children) {
        children = Array.isArray(p.children) ? p.children : [p.children];
    }
    const [s, setState] = useState({ xmlNodes: [], xmlNamedNodes: {}, namedReactNodes: {} });
    useEffect(() => {
        const xmlNodes = [];
        const xmlNamedNodes = {};
        const xmlDoc = new DOMParser().parseFromString(`<root> ${p.message} </root>`, 'text/xml');
        const nodeList = xmlDoc.childNodes[0].childNodes;
        nodeList.forEach(node => {
            xmlNodes.push(node);
            if (node.nodeName !== '#text')
                xmlNamedNodes[node.nodeName] = node;
        });
        const namedReactNodes = keyBy(children, node => node.props.slot);
        setState({ xmlNodes, xmlNamedNodes, namedReactNodes });
    }, [p.message]);
    function render() {
        return React.createElement("span", null, s.xmlNodes.map(renderXmlNode));
    }
    function renderXmlNode(xmlNode, ind) {
        var _a;
        if (xmlNode.nodeName === 'script') {
            throw new Error('XSS injection detected');
        }
        if (xmlNode.nodeName === '#text') {
            return xmlNode.textContent;
        }
        const slotName = camelize(xmlNode['tagName']);
        const namedReactNode = s.namedReactNodes[slotName];
        if (namedReactNode) {
            return createElement(namedReactNode.type, Object.assign(Object.assign({}, namedReactNode.props), { key: ind }), xmlNode.textContent);
        }
        else if (p.renderSlots && p.renderSlots[slotName]) {
            return p.renderSlots[slotName]((_a = xmlNode.textContent) !== null && _a !== void 0 ? _a : '');
        }
        else {
            return createElement(xmlNode.nodeName, { key: ind }, xmlNode.textContent);
        }
    }
    return render();
}
//# sourceMappingURL=Translate.js.map