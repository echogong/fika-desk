import { createRoot } from 'react-dom/client';
import { Root } from './Root';
// 界面与 Agent 回答的开源字体，打包进前端，不从外网加载。
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/source-sans-3';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
if (import.meta.env.MODE === 'fixture') {
  // 设计评审用的样例数据，只有 vite build --mode fixture 才会打包进去
  void import('./fixture').then(({ Fixture, loadFixture }) => {
    loadFixture();
    root.render(<Fixture />);
  });
} else {
  root.render(<Root />);
}
