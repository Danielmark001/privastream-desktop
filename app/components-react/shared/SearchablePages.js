var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Spinner from './Spinner';
import Mark from 'mark.js';
import styles from './SearchablePages.m.less';
import { SETTINGS_CONFIG } from 'components-react/windows/Settings';
import { createRoot } from 'components-react/root/ReactRoot';
export default function SearchablePages(p) {
    const pagesInfo = useRef(null);
    const pageRef = useRef(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (loading || p.searchStr === '' || p.searchStr.length < 3)
            return;
        function searchHandler() {
            return __awaiter(this, void 0, void 0, function* () {
                if (!pagesInfo.current)
                    yield scanPages();
                const searchResultPages = [];
                if (!pagesInfo.current)
                    return;
                for (const pageName of Object.keys(pagesInfo.current)) {
                    const pageText = pagesInfo.current[pageName];
                    if (pageText && pageText.match(new RegExp(p.searchStr, 'ig'))) {
                        searchResultPages.push(pageName);
                    }
                }
                if (searchResultPages.length === 0)
                    return;
                p.onSearchCompleted && p.onSearchCompleted(searchResultPages);
            });
        }
        searchHandler().then(highlightPage);
    }, [p.searchStr, loading]);
    useEffect(() => {
        if (loading || p.searchStr === '' || p.searchStr.length < 3)
            return;
        highlightPage();
    }, [p.page]);
    function scanPages() {
        return __awaiter(this, void 0, void 0, function* () {
            setLoading(true);
            pagesInfo.current = {};
            for (const page of p.pages) {
                const component = SETTINGS_CONFIG[page].component;
                pagesInfo.current[page] = yield grabReactTextContent(component);
            }
            setLoading(false);
        });
    }
    function grabReactTextContent(component) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!component)
                return '';
            const tempDiv = document.createElement('div');
            const RootedComponent = createRoot(component);
            yield ReactDOM.render(React.createElement(RootedComponent, null), tempDiv);
            const stringValue = tempDiv.innerText || '';
            yield ReactDOM.unmountComponentAtNode(tempDiv);
            tempDiv.remove();
            return stringValue;
        });
    }
    function highlightPage() {
        if (!pageRef.current)
            return;
        const mark = new Mark(pageRef.current);
        mark.unmark();
        if (p.searchStr)
            mark.mark(p.searchStr);
        const pageInfo = pagesInfo.current && pagesInfo.current[p.page];
        if (pageInfo) {
            getPageInputs().forEach($input => {
                $input.classList.remove('search-highlight');
                const needHighlight = p.searchStr && inputText($input).match(new RegExp(p.searchStr, 'i'));
                if (needHighlight)
                    $input.classList.add('search-highlight');
            });
        }
        pageRef.current.querySelectorAll('button').forEach($btn => {
            $btn.classList.remove('search-highlight');
            if (!$btn.querySelectorAll('mark').length)
                return;
            $btn.classList.add('search-highlight');
        });
        const $scrollToEl = pageRef.current.querySelector('mark, .search-highlight');
        if ($scrollToEl)
            $scrollToEl.scrollIntoView({ block: 'nearest' });
    }
    function inputText($input) {
        const inputsText = Array.from($input.querySelectorAll('[type="text"]'))
            .map(($textInput) => $textInput.value)
            .join(' ');
        const listOptionsText = Array.from($input.querySelectorAll('[data-option-value]'))
            .map(($option) => $option.innerText)
            .join(' ');
        return `${inputsText} ${$input.innerText} ${listOptionsText}`;
    }
    function getPageInputs() {
        if (!pageRef.current)
            return [];
        return Array.from(pageRef.current.querySelectorAll('[data-role="input"]')).filter(($el) => $el.matches(':not([data-search-exclude])'));
    }
    return (React.createElement("div", { className: styles.searchablePages },
        loading && React.createElement(Spinner, null),
        React.createElement("div", { ref: pageRef }, !loading && p.children)));
}
//# sourceMappingURL=SearchablePages.js.map