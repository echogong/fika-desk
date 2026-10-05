import { LANGUAGE_NAMES, LOCALES, setLocale, tx, useLocale } from '../../i18n';
import './language-settings.css';

export function LanguageTab() {
  const locale = useLocale();
  return (
    <section className="language-settings" aria-labelledby="language-heading">
      <header className="shead">
        <div className="txt">
          <h2 id="language-heading">{tx('语言')}</h2>
          <p>{tx('选择界面语言，切换立即生效。')}</p>
        </div>
      </header>
      <fieldset className="language-options">
        <legend>{tx('界面语言')}</legend>
        {LOCALES.map((id) => (
          <label key={id} className="language-choice">
            <input type="radio" name="interface-language" value={id} checked={locale === id} onChange={() => setLocale(id)} />
            <span lang={id}>{LANGUAGE_NAMES[id]}</span>
            {locale === id && <span className="language-current">{tx('当前语言')}</span>}
          </label>
        ))}
      </fieldset>
      <p className="help">{tx('语言选择保存在此浏览器中。对话内容、代码和文件名保留原文。')}</p>
      <div className="language-type-preview" aria-label={tx('字体预览')}>
        <p className="language-type-label">{tx('字体预览')}</p>
        <p className="language-type-title">{tx('让想法成为作品。')}</p>
        <p>{tx('清晰的界面，安静地专注于创造。')}</p>
        <p className="language-type-samples"><span lang="zh-CN">你好</span> · <span lang="zh-TW">你好</span> · <span lang="en">Hello</span> · <span lang="sv">Hej, Å Ä Ö</span> · <span lang="ja">こんにちは</span></p>
      </div>
    </section>
  );
}
