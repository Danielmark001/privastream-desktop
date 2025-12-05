import React, { Component } from 'react';
import uuid from 'uuid';
import { I18nService } from '../../services/i18n';
import { StatefulService } from '../../services/core/stateful-service';
import Vue from 'vue';
import isEqual from 'lodash/isEqual';
export class VueComponent extends Component {
    constructor(props) {
        super(props);
        this.wrapperRef = React.createRef();
        this.state = { id: uuid(), vueInstance: null };
    }
    componentDidMount() {
        const { componentClass, componentProps } = this.props;
        const { id } = this.state;
        const vueInstance = new Vue({
            i18n: I18nService.vueI18nInstance,
            store: StatefulService.store,
            el: `#component-${id}`,
            data() {
                return { componentClass, componentProps };
            },
            methods: {
                updateProps(newProps) {
                    this['componentClass'] = newProps.componentClass;
                    this['componentProps'] = newProps.componentProps;
                },
            },
            render(h) {
                return h(this['componentClass'], { props: this['componentProps'] });
            },
        });
        this.setState(Object.assign(Object.assign({}, this.state), { vueInstance }));
    }
    componentDidUpdate(props) {
        this.state.vueInstance['updateProps'](props);
    }
    shouldComponentUpdate(nextProps) {
        return (nextProps.componentClass !== this.props.componentClass || !isEqual(nextProps, this.props));
    }
    render() {
        return (<div className="vue-component-wrapper" ref={this.wrapperRef} id={`component-${this.state.id}`}></div>);
    }
}
//# sourceMappingURL=VueComponent.jsx.map