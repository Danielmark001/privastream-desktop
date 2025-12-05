var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useEffect, useState } from 'react';
import Typography from 'antd/lib/typography';
import Switch from 'antd/lib/switch';
import Slider from 'antd/lib/slider';
import Card from 'antd/lib/card';
import List from 'antd/lib/list';
import Button from 'antd/lib/button';
import message from 'antd/lib/message';
import Input from 'antd/lib/input';
const { Title, Text } = Typography;
export default function PrivacyPage() {
    const [settings, setSettings] = useState({
        blur_enabled: true,
        blur_strength: 50,
        face_detection_confidence: 0.5,
    });
    const [whitelist, setWhitelist] = useState([]);
    const [newFaceName, setNewFaceName] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        fetchSettings();
        fetchWhitelist();
    }, []);
    const fetchSettings = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch('http://localhost:8000/settings');
            if (res.ok) {
                const data = yield res.json();
                setSettings(data);
            }
        }
        catch (err) {
            console.error('Failed to fetch settings', err);
        }
    });
    const fetchWhitelist = () => __awaiter(this, void 0, void 0, function* () {
        try {
            const res = yield fetch('http://localhost:8000/whitelist');
            if (res.ok) {
                const data = yield res.json();
                setWhitelist(data.names || []);
            }
        }
        catch (err) {
            console.error('Failed to fetch whitelist', err);
        }
    });
    const updateSetting = (key, value) => __awaiter(this, void 0, void 0, function* () {
        const newSettings = Object.assign(Object.assign({}, settings), { [key]: value });
        setSettings(newSettings);
        try {
            yield fetch('http://localhost:8000/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
        }
        catch (err) {
            message.error('Failed to update settings');
        }
    });
    const addToWhitelist = () => __awaiter(this, void 0, void 0, function* () {
        if (!newFaceName)
            return;
        try {
            setLoading(true);
            message.info('To add a face, we need to capture an image. This feature is coming soon.');
            setNewFaceName('');
        }
        catch (err) {
            message.error('Failed to add to whitelist');
        }
        finally {
            setLoading(false);
        }
    });
    const containerStyle = {
        padding: '24px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: '#17242D',
        color: 'white',
    };
    const cardStyle = {
        backgroundColor: '#1e2b36',
        border: '1px solid #2b3b47',
        marginBottom: '24px',
    };
    const textStyle = {
        color: 'white',
    };
    return (<div style={containerStyle}>
      <Title level={2} style={{ color: 'white' }}>Privacy Controls</Title>
      
      <div style={{ marginBottom: 24, padding: '16px', backgroundColor: '#1e2b36', border: '1px solid #2b3b47', borderRadius: '4px' }}>
        <Text style={{ color: '#aaa' }}>
          To use these features, go to the <strong>Editor</strong>, add a new <strong>Video Capture Device</strong> source, and select <strong>PrivaStream Virtual Camera</strong>.
        </Text>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Card title={<span style={textStyle}>General Settings</span>} style={cardStyle} bordered={false}>
          <div style={{ marginBottom: 16 }}>
            <Text style={{ color: 'white', marginRight: 16 }}>Enable Face Blurring</Text>
            <Switch checked={settings.blur_enabled} onChange={(v) => updateSetting('blur_enabled', v)}/>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <Text style={{ color: 'white' }}>Blur Strength ({settings.blur_strength}%)</Text>
            <Slider min={0} max={100} value={settings.blur_strength} onChange={(v) => updateSetting('blur_strength', v)}/>
          </div>

          <div>
            <Text style={{ color: 'white' }}>Detection Confidence ({settings.face_detection_confidence})</Text>
            <Slider min={0} max={1} step={0.01} value={settings.face_detection_confidence} onChange={(v) => updateSetting('face_detection_confidence', v)}/>
          </div>
        </Card>
      </div>

      <div>
        <Card title={<span style={textStyle}>Whitelisted Faces (Safe to Show)</span>} style={cardStyle} bordered={false}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <Input placeholder="Enter name" value={newFaceName} onChange={e => setNewFaceName(e.target.value)} style={{ backgroundColor: '#17242D', color: 'white', border: '1px solid #3a4b57' }}/>
            <Button type="primary" onClick={addToWhitelist} loading={loading}>
              Add Face
            </Button>
          </div>
          
          <List dataSource={whitelist} renderItem={item => (<List.Item style={{ borderBottom: '1px solid #2b3b47' }}>
                <Text style={{ color: 'white' }}>{item}</Text>
              </List.Item>)}/>
          {whitelist.length === 0 && <Text style={{ color: '#888' }}>No faces whitelisted.</Text>}
        </Card>
      </div>
    </div>);
}
//# sourceMappingURL=PrivacyPage.jsx.map