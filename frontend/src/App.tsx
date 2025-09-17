import React, { useState } from 'react';
import { Input, Button, Card, message, Spin, Select } from 'antd';
import axios from 'axios';
import './App.css';

const { TextArea } = Input;
const { Option } = Select;

interface GenerateRequest {
  text: string;
  temperature?: number;
  max_tokens?: number;
  model?: string;
  // 新增LoRA参数
  lora_r?: number;
  lora_alpha?: number;
  lora_dropout?: number;
  target_modules?: string[];
}

function App() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [selectedModel, setSelectedModel] = useState('mistral-7b');
  const [maxTokens, setMaxTokens] = useState(350);
  const [topP, setTopP] = useState(0.9);
  
  // 新增LoRA参数状态
  const [loraR, setLoraR] = useState(12);
  const [loraAlpha, setLoraAlpha] = useState(16);
  const [loraDropout, setLoraDropout] = useState(0.1);
  const [targetModules, setTargetModules] = useState(['query', 'key', 'value']);

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      message.error('请输入文本');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post<{generated_text: string, status: string}>(
        'http://localhost:8080/api/generate',
        {
          text: inputText,
          temperature: temperature,
          max_tokens: maxTokens,
          model: selectedModel,
          // 传递LoRA参数
          lora_r: loraR,
          lora_alpha: loraAlpha,
          lora_dropout: loraDropout,
          target_modules: targetModules
        } as GenerateRequest
      );
      
      setOutputText(response.data.generated_text);
      message.success('文本生成成功');
    } catch (error) {
      message.error('生成失败，请检查后端服务');
      console.error('生成错误:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* 顶部标题 */}
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '32px', margin: '0', color: '#1890ff' }}>AI4L</h1>
          <p style={{ fontSize: '16px', color: '#666', margin: '10px 0' }}>
            基于大模型微调的风格模仿文本生成
          </p>
        </div>

        {/* 响应式三栏布局 */}
        <div className="grid-container grid-3" style={{ minHeight: '600px', gap: '15px' }}>
          {/* 左侧：文本输入 */}
          <div className="grid-item">
            <Card title="文本输入" style={{ height: '100%', minHeight: '600px' }}>
              <TextArea
                rows={12}
                placeholder="请输入想要模仿的作家的txt文本..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ resize: 'none', marginBottom: '20px' }}
              />
              
              <Button 
                type="primary" 
                size="large"
                onClick={handleGenerate}
                loading={loading}
                disabled={!inputText.trim()}
                style={{ width: '100%', height: '45px' }}
              >
                {loading ? '生成中...' : '生成文本'}
              </Button>
            </Card>
          </div>

          {/* 中间：生成结果 */}
          <div className="grid-item">
            <Card title="生成结果" style={{ height: '100%', minHeight: '600px' }}>
              <Spin spinning={loading} style={{ height: '100%' }}>
                <TextArea
                  rows={18}
                  value={outputText}
                  placeholder="生成的文本将显示在这里..."
                  readOnly
                  style={{ 
                    height: 'calc(100% - 20px)',
                    resize: 'none',
                    backgroundColor: '#fafafa'
                  }}
                />
              </Spin>
            </Card>
          </div>

          {/* 右侧：模型选择和参数设置 */}
          <div className="grid-item">
            {/* 模型选择 */}
            <Card title="模型选择" style={{ marginBottom: '15px' }}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  选择模型：
                </label>
                <Select
                  value={selectedModel}
                  onChange={setSelectedModel}
                  style={{ width: '100%' }}
                  size="large"
                >
                  <Option value="mistral-7b v0.1">Mistral 7B v0.1</Option>
                  <Option value="llama-7b">LLaMA 7B</Option>
                  <Option value="Camembert-base">Camembert-base</Option>
                  <Option value="claude-3">Claude-3</Option>
                </Select>
              </div>
            </Card>

            {/* 基础生成参数设置 */}
            <Card title="生成参数设置" style={{ marginBottom: '15px' }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Temperature: {temperature}
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
                  <span>保守</span>
                  <span>创新</span>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range"
                  min={50}
                  max={1000}
                  step={50}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
                  <span>50</span>
                  <span>1000</span>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Top P: {topP}
                </label>
                <input
                  type="range"
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
                  <span>0.1</span>
                  <span>1.0</span>
                </div>
              </div>
            </Card>

            {/* 新增：LoRA微调参数设置 */}
            <Card title="LoRA微调参数" style={{ height: 'auto' }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  LoRA Rank (r): {loraR}
                </label>
                <input
                  type="range"
                  min={1}
                  max={64}
                  step={1}
                  value={loraR}
                  onChange={(e) => setLoraR(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
                  <span>1</span>
                  <span>64</span>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  LoRA Alpha: {loraAlpha}
                </label>
                <input
                  type="range"
                  min={1}
                  max={128}
                  step={1}
                  value={loraAlpha}
                  onChange={(e) => setLoraAlpha(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
                  <span>1</span>
                  <span>128</span>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  LoRA Dropout: {loraDropout}
                </label>
                <input
                  type="range"
                  min={0.0}
                  max={0.5}
                  step={0.01}
                  value={loraDropout}
                  onChange={(e) => setLoraDropout(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#999' }}>
                  <span>0.0</span>
                  <span>0.5</span>
                </div>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  目标模块：
                </label>
                <Select
                  mode="multiple"
                  value={targetModules}
                  onChange={setTargetModules}
                  style={{ width: '100%' }}
                  placeholder="选择目标模块"
                >
                  <Option value="query">Query</Option>
                  <Option value="key">Key</Option>
                  <Option value="value">Value</Option>
                  <Option value="gate_proj">Gate Proj</Option>
                  <Option value="up_proj">Up Proj</Option>
                  <Option value="down_proj">Down Proj</Option>
                </Select>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;