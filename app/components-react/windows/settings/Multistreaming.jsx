var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React from 'react';
import { useVuex } from 'components-react/hooks';
import { Services } from '../../service-provider';
import { $t } from 'services/i18n';
import { ObsSettingsSection } from './ObsSettings';
import Translate from 'components-react/shared/Translate';
import UltraIcon from 'components-react/shared/UltraIcon';
import ButtonHighlighted from 'components-react/shared/ButtonHighlighted';
import styles from './Multistreaming.m.less';
export function MultistreamingSettings() {
    const { UserService, MagicLinkService, DualOutputService, StreamingService } = Services;
    const v = useVuex(() => ({
        isLoggedIn: UserService.views.isLoggedIn,
        isPrime: UserService.views.isPrime,
    }));
    function upgradeToPrime() {
        return __awaiter(this, void 0, void 0, function* () {
            MagicLinkService.actions.linkToPrime('slobs-multistream-settings');
        });
    }
    const shouldShowPrime = v.isLoggedIn && !v.isPrime;
    return (<div className="multistreaming-wrapper">
      <ObsSettingsSection title={$t('Multistreaming')}>
        {shouldShowPrime ? (<div style={{ marginBottom: '16px' }}>
            <Translate message="Stream to multiple platforms at once with <ultra>Streamlabs Ultra</ultra>.">
              <u slot="ultra"/>
            </Translate>
            <ButtonHighlighted onClick={upgradeToPrime} filled text={$t('Upgrade to Ultra')} icon={<UltraIcon type="simple" style={{
                    marginRight: '8px',
                }}/>}/>
          </div>) : (<div className={styles.wrapper}>
            {$t('Go live on multiple platforms at once with Multistreaming.')}
            <ul>
              <li>
                <Translate message="Step 1: Connect your streaming accounts in the <stream>Stream</stream> settings.">
                  <u slot="stream"/>
                </Translate>
              </li>
              <li>
                <Translate message={'Step 2: Ensure the \"Confirm stream title and game before going live\" option is checked in the <general>General</general> settings tab."'}>
                  <u slot="general"/>
                </Translate>
              </li>
              <li>
                {$t('Step 3: Select which platforms you are streaming to when you hit \"Go Live\".')}
              </li>
            </ul>
          </div>)}
      </ObsSettingsSection>
    </div>);
}
//# sourceMappingURL=Multistreaming.jsx.map