// 页面入口：先问登录状态。没登录显示登录页（或首次设置密码），登录后才建立实时连接、显示主界面。
import { useEffect, useRef, useState } from 'react';
import { APP_NAME } from '../../shared/brand';
import { App } from './App';
import { checkAuth } from './auth';
import { AuthPage } from './components/AuthPage';
import { setState, useStore } from './store';
import { connect } from './ws';
import { useLocale } from './i18n';

export function Root() {
  useLocale();
  const auth = useStore((s) => s.auth);
  const theme = useStore((s) => s.theme);
  const [home, setHome] = useState(() => location.hash === '#home');
  const previousHome = useRef(home);

  // 品牌链接只切换页面；实时连接和会话保留，浏览器前进、后退也可返回。
  useEffect(() => {
    const onHash = () => setHome(location.hash === '#home');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const enterWorkspace = () => {
    if (location.hash === '#home') location.hash = '';
    setHome(false);
  };

  useEffect(() => {
    if (!auth.checked || !auth.loggedIn) return;
    const returning = previousHome.current && !home;
    previousHome.current = home;
    if (home) {
      setState({ agentMenu: false, drawer: null, dialog: null });
      document.title = APP_NAME;
      return;
    }
    if (!returning) return;
    const frame = requestAnimationFrame(() => {
      const selector = matchMedia('(max-width: 760px)').matches ? '.mobile-menu' : '.brand-home';
      document.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [home, auth.checked, auth.loggedIn]);

  // 配色：跟随系统时监听系统切换；登录页也用
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      document.documentElement.dataset.theme = theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    void checkAuth();
  }, []);

  useEffect(() => {
    if (auth.loggedIn) connect();
  }, [auth.loggedIn]);

  if (!auth.checked) return null;
  if (!auth.loggedIn || home) return <AuthPage auth={auth} onEnterWorkspace={enterWorkspace} />;
  return <App />;
}
