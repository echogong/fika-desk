// UI-owned text only. Order: zh-TW, en, sv, ja. Never translate conversation content.
export const catalog: Record<string, readonly [string, string, string, string]> = {
  "关闭文件夹：{0}": ["關閉資料夾：{0}", "Close folder: {0}", "Stäng mapp: {0}", "フォルダーを閉じる：{0}"],
  "关闭文件夹（保留文件和会话记录）": ["關閉資料夾（保留檔案與工作階段記錄）", "Close folder (keep files and session history)", "Stäng mapp (behåll filer och sessionshistorik)", "フォルダーを閉じる（ファイルとセッション履歴は保持）"],
  "正在关闭文件夹": ["正在關閉資料夾", "Closing folder", "Stänger mapp", "フォルダーを閉じています"],
  "已关闭文件夹：{0}": ["已關閉資料夾：{0}", "Closed folder: {0}", "Stängde mapp: {0}", "フォルダーを閉じました：{0}"],
  "返回登录首页": ["返回登入首頁", "Back to the sign-in home page", "Tillbaka till inloggningssidan", "ログインのトップページに戻る"],
  "返回工作区": ["返回工作區", "Return to workspace", "Tillbaka till arbetsytan", "ワークスペースに戻る"],
  "已登录，可直接返回工作区。": ["已登入，可直接返回工作區。", "You’re signed in. Return to your workspace whenever you’re ready.", "Du är inloggad och kan gå tillbaka till arbetsytan direkt.", "ログイン済みです。ワークスペースにそのまま戻れます。"],
  "每页 {0} 条": ["每頁 {0} 條", "{0} entries per page", "{0} poster per sida", "1 ページ {0} 件"],
  "第 {0} 页": ["第 {0} 頁", "Page {0}", "Sida {0}", "{0} ページ"],
  "查看更多": ["查看更多", "View more", "Visa fler", "もっと見る"],
  "上一页": ["上一頁", "Previous", "Föregående", "前のページ"],
  "下一页": ["下一頁", "Next", "Nästa", "次のページ"],
  "加载中…": ["載入中…", "Loading…", "Laddar…", "読み込み中…"],
  "确认": ["確認", "Confirm", "Bekräfta", "確認"],
  "账号与用量": ["帳號與用量", "Account & usage", "Konto och användning", "アカウントと使用量"],
  "配置来源": ["配置來源", "Configuration source", "Konfigurationskälla", "設定の参照元"],
  "运行信息": ["執行資訊", "Runtime details", "Körningsinformation", "実行情報"],
  "连接详情": ["連線詳情", "Connection details", "Anslutningsdetaljer", "接続の詳細"],
  "原生登录与配置文档": ["原生登入與配置文件", "Native sign-in & configuration docs", "Inbyggd inloggning och dokumentation", "標準ログインと設定ドキュメント"],
  "最近 {0} 条": ["最近 {0} 條", "Latest {0} entries", "Senaste {0} posterna", "最新 {0} 件"],
  "确认新密码": ["確認新密碼", "Confirm new password", "Bekräfta nytt lösenord", "新しいパスワードの確認"],
  "上下文用量暂不可用": ["上下文用量暫不可用", "Context usage unavailable", "Kontextanvändning är inte tillgänglig", "コンテキスト使用量はまだ不明です"],
  "Agent 尚未上报上下文用量": ["Agent 尚未回報上下文用量", "The Agent has not reported context usage", "Agenten har inte rapporterat kontextanvändning", "Agent はコンテキスト使用量をまだ報告していません"],
  "上下文已用 {0}%": ["上下文已用 {0}%", "Context used: {0}%", "Kontext använt: {0} %", "コンテキスト使用済み {0}%"],
  "订阅用量暂不可用": ["訂閱用量暫不可用", "Subscription usage unavailable", "Prenumerationsanvändning är inte tillgänglig", "サブスクリプション使用量はまだ不明です"],
  "订阅剩余 {0}%": ["訂閱剩餘 {0}%", "Subscription remaining: {0}%", "Prenumeration kvar: {0} %", "サブスクリプション残り {0}%"],
  "Agent 尚未上报 token 消耗": ["Agent 尚未回報 token 消耗", "The Agent has not reported token consumption", "Agenten har inte rapporterat tokenförbrukning", "Agent は token 消費量をまだ報告していません"],
  "本会话已记录 {0} tokens": ["本會話已記錄 {0} tokens", "Recorded in this session: {0} tokens", "Registrerat i denna session: {0} tokens", "このセッションで記録済み {0} tokens"],
  "查看用量：{0}": ["查看用量：{0}", "View usage: {0}", "Visa användning: {0}", "使用量を見る：{0}"],
  "用量详情": ["用量詳情", "Usage details", "Användningsdetaljer", "使用量の詳細"],
  "订阅用量": ["訂閱用量", "Subscription usage", "Prenumerationsanvändning", "サブスクリプション使用量"],
  "Token 消耗": ["Token 消耗", "Token consumption", "Tokenförbrukning", "Token 消費量"],
  "剩余 {0}%": ["剩餘 {0}%", "{0}% remaining", "{0} % kvar", "残り {0}%"],
  "{0} 重置": ["{0} 重置", "Resets {0}", "Återställs {0}", "{0} にリセット"],
  "供应商尚未提供订阅用量数据。": ["供應商尚未提供訂閱用量資料。", "The provider has not supplied subscription usage data.", "Leverantören har inte tillhandahållit prenumerationsdata.", "プロバイダーがサブスクリプション使用量を提供していません。"],
  "统计当前会话中 Agent 上报的消耗，包含输入、输出及已报告的缓存 token。": ["統計目前會話中 Agent 回報的消耗，包含輸入、輸出及已報告的快取 token。", "Tracks consumption reported by the Agent in this session, including input, output and reported cached tokens.", "Visar förbrukningen som agenten rapporterar i denna session, inklusive indata, utdata och rapporterade cachetokens.", "このセッションで Agent が報告した入力・出力・報告済みキャッシュ token の消費量を表示します。"],
  "部分轮次未提供完整统计，显示已记录的消耗；不代表供应商账单。": ["部分輪次未提供完整統計，顯示已記錄的消耗；不代表供應商帳單。", "Some turns lack complete statistics. Shows recorded consumption, not the provider’s bill.", "Vissa turer saknar fullständig statistik. Visar registrerad förbrukning, inte leverantörens faktura.", "一部のターンには完全な統計がありません。記録済み消費量を表示し、プロバイダーの請求額は表しません。"],
  "当前轮次完成后更新 token 消耗。": ["目前輪次完成後更新 token 消耗。", "Token consumption updates when the current turn finishes.", "Tokenförbrukningen uppdateras när den aktuella turen avslutas.", "現在のターンが完了すると token 消費量が更新されます。"],
  "和服务的连接断开了，正在重新连接…": [
    "和服務的連線斷開了，正在重新連線…",
    "Connection lost. Reconnecting…",
    "Anslutningen bröts. Återansluter…",
    "接続が切れました。再接続中…"
  ],
  "连不上服务，稍后再试": [
    "連不上服務，稍後再試",
    "Cannot connect. Try again later.",
    "Kan inte ansluta. Försök senare.",
    "接続できません。後でもう一度お試しください。"
  ],
  "登录已过期，请重新登录": [
    "登入已過期，請重新登入",
    "Your login expired. Sign in again.",
    "Din inloggning har gått ut. Logga in igen.",
    "ログインの有効期限が切れました。再度ログインしてください。"
  ],
  "出错了（{0}）": [
    "出錯了（{0}）",
    "An error occurred ({0})",
    "Ett fel inträffade ({0})",
    "エラーが発生しました（{0}）"
  ],
  "登录状态查询失败：{0}": [
    "登入狀態查詢失敗：{0}",
    "Could not check login status: {0}",
    "Kunde inte kontrollera inloggningen: {0}",
    "ログイン状態を確認できませんでした：{0}"
  ],
  "允许这一次": [
    "允許這一次",
    "Allow once",
    "Tillåt en gång",
    "今回のみ許可"
  ],
  "以后都允许": [
    "以後都允許",
    "Always allow",
    "Tillåt alltid",
    "常に許可"
  ],
  "拒绝": [
    "拒絕",
    "Deny",
    "Neka",
    "拒否"
  ],
  "以后都拒绝": [
    "以後都拒絕",
    "Always deny",
    "Neka alltid",
    "常に拒否"
  ],
  "想执行": [
    "想執行",
    "wants to run",
    "vill köra",
    "実行を要求"
  ],
  "想删除": [
    "想刪除",
    "wants to delete",
    "vill ta bort",
    "削除を要求"
  ],
  "想修改": [
    "想修改",
    "wants to edit",
    "vill ändra",
    "変更を要求"
  ],
  "请求批准": [
    "請求批准",
    "Approval requested",
    "Begär godkännande",
    "承認を要求"
  ],
  "待批准：{0} {1}": [
    "待批准：{0} {1}",
    "Awaiting approval: {0} {1}",
    "Väntar på godkännande: {0} {1}",
    "承認待ち：{0} {1}"
  ],
  "在 {0} 里执行": [
    "在 {0} 裡執行",
    "Run in {0}",
    "Kör i {0}",
    "{0} で実行"
  ],
  "这类操作不再问": [
    "這類操作不再問",
    "Don't ask for this operation again",
    "Fråga inte igen för denna åtgärd",
    "この操作では今後確認しない"
  ],
  "还有": [
    "還有",
    "Another",
    "Ytterligare",
    "ほかに"
  ],
  "项待批准": [
    "項待批准",
    "awaiting approval",
    "väntar på godkännande",
    "件が承認待ち"
  ],
  "密码不对。再输错 {0} 次，这个 IP 会被锁定 15 分钟。": [
    "密碼不對。再輸錯 {0} 次，這個 IP 會被鎖定 15 分鐘。",
    "Incorrect password. After {0} more failed attempts, this IP will be locked for 15 minutes.",
    "Fel lösenord. Efter ytterligare {0} felaktiga försök spärras denna IP i 15 minuter.",
    "パスワードが違います。あと {0} 回間違えると、この IP は15分間ロックされます。"
  ],
  "至少要 {0} 位。": [
    "至少要 {0} 位。",
    "Use at least {0} characters.",
    "Använd minst {0} tecken.",
    "{0} 文字以上で入力してください。"
  ],
  "太长了，最多 256 位。": [
    "太長了，最多 256 位。",
    "Too long. Maximum 256 characters.",
    "För långt. Högst 256 tecken.",
    "長すぎます。最大256文字です。"
  ],
  "出错了，稍后再试。": [
    "出錯了，稍後再試。",
    "Something went wrong. Try again later.",
    "Något gick fel. Försök senare.",
    "エラーが発生しました。後でもう一度お試しください。"
  ],
  "两次输入的密码不一样。": [
    "兩次輸入的密碼不一樣。",
    "The passwords don't match.",
    "Lösenorden stämmer inte överens.",
    "パスワードが一致しません。"
  ],
  "先输入密码。": [
    "先輸入密碼。",
    "Enter your password first.",
    "Ange lösenordet först.",
    "パスワードを入力してください。"
  ],
  "至少 {0} 位{1}。": [
    "至少 {0} 位{1}。",
    "At least {0} characters{1}.",
    "Minst {0} tecken{1}.",
    "{0} 文字以上{1}。"
  ],
  "，还差 {0} 位": [
    "，還差 {0} 位",
    ", {0} more needed",
    ", ytterligare {0} behövs",
    "、あと {0} 文字必要です"
  ],
  "已达到要求，再长一些更安全。": [
    "已達到要求，再長一些更安全。",
    "Meets the requirement. A longer password is safer.",
    "Uppfyller kravet. Ett längre lösenord är säkrare.",
    "要件を満たしています。長いパスワードはより安全です。"
  ],
  "很好。": [
    "很好。",
    "Looks good.",
    "Bra.",
    "十分な長さです。"
  ],
  "隐藏密码": [
    "隱藏密碼",
    "Hide password",
    "Dölj lösenord",
    "パスワードを隠す"
  ],
  "显示密码": [
    "顯示密碼",
    "Show password",
    "Visa lösenord",
    "パスワードを表示"
  ],
  "一边喝咖啡，": [
    "一邊喝咖啡，",
    "Enjoy your coffee,",
    "Ta en kopp kaffe,",
    "コーヒーを飲みながら、"
  ],
  "一边看": [
    "一邊看",
    "while",
    "medan",
    "見守ろう。"
  ],
  "还没设置登录密码": [
    "還沒設定登入密碼",
    "No login password yet",
    "Inget inloggningslösenord ännu",
    "ログインパスワードが未設定です"
  ],
  "设置登录密码": [
    "設定登入密碼",
    "Set login password",
    "Ange inloggningslösenord",
    "ログインパスワードを設定"
  ],
  "登录": [
    "登入",
    "Sign in",
    "Logga in",
    "ログイン"
  ],
  "尝试次数太多，已暂时锁定。": [
    "嘗試次數太多，已暫時鎖定。",
    "Too many attempts. Temporarily locked.",
    "För många försök. Tillfälligt spärrad.",
    "試行回数が多すぎるため、一時的にロックされています。"
  ],
  "咖啡先凉一凉，还要等": [
    "咖啡先涼一涼，還要等",
    "Let your coffee cool. Try again in",
    "Låt kaffet svalna. Försök igen om",
    "コーヒーを冷ましながら、あと"
  ],
  "分": [
    "分",
    "min",
    "min",
    "分"
  ],
  "秒": [
    "秒",
    "sec",
    "sek",
    "秒"
  ],
  "，之后可以再试。": [
    "，之後可以再試。",
    ".",
    ".",
    "で再試行できます。"
  ],
  "新密码": [
    "新密碼",
    "New password",
    "Nytt lösenord",
    "新しいパスワード"
  ],
  "密码": [
    "密碼",
    "Password",
    "Lösenord",
    "パスワード"
  ],
  "忘记密码": [
    "忘記密碼",
    "Forgot password",
    "Glömt lösenord",
    "パスワードを忘れた場合"
  ],
  "至少 {0} 位": [
    "至少 {0} 位",
    "At least {0} characters",
    "Minst {0} tecken",
    "{0} 文字以上"
  ],
  "再输一次": [
    "再輸一次",
    "Repeat password",
    "Upprepa lösenord",
    "パスワードを再入力"
  ],
  "锁定中": [
    "鎖定中",
    "Locked",
    "Spärrad",
    "ロック中"
  ],
  "请稍候…": [
    "請稍候…",
    "Please wait…",
    "Vänta…",
    "お待ちください…"
  ],
  "设置并进入": [
    "設定並進入",
    "Set password and enter",
    "Ange lösenord och fortsätt",
    "設定して開始"
  ],
  "重置。": [
    "重置。",
    "to reset it.",
    "för att återställa det.",
    "でリセットできます。"
  ],
  "{0}：请选择 PNG、JPEG、WebP 或 GIF 图片": [
    "{0}：請選擇 PNG、JPEG、WebP 或 GIF 圖片",
    "{0}: Choose a PNG, JPEG, WebP or GIF image",
    "{0}: Välj en PNG-, JPEG-, WebP- eller GIF-bild",
    "{0}：PNG、JPEG、WebP または GIF を選択してください"
  ],
  "{0}：每张图片不能超过 10 MB": [
    "{0}：每張圖片不能超過 10 MB",
    "{0}: Each image must be 10 MB or smaller",
    "{0}: Varje bild får vara högst 10 MB",
    "{0}：画像1枚あたり10 MB以下にしてください"
  ],
  "每条消息最多添加 4 张图片": [
    "每條訊息最多新增 4 張圖片",
    "Up to 4 images per message",
    "Högst 4 bilder per meddelande",
    "1件のメッセージに添付できる画像は4枚までです"
  ],
  "图片总大小不能超过 20 MB": [
    "圖片總大小不能超過 20 MB",
    "Images must total 20 MB or less",
    "Bildernas totala storlek får vara högst 20 MB",
    "画像の合計サイズは20 MB以下にしてください"
  ],
  "连接已断开，草稿已保留。重新连接后再发送。": [
    "連線已斷開，草稿已保留。重新連線後再發送。",
    "Disconnected. Your draft is saved. Send it after reconnecting.",
    "Frånkopplad. Utkastet är sparat. Skicka efter återanslutning.",
    "接続が切れました。下書きは保持されています。再接続後に送信してください。"
  ],
  "{0} 不支持图片输入，请换一个支持图片的 Agent。": [
    "{0} 不支援圖片輸入，請換一個支援圖片的 Agent。",
    "{0} does not support images. Choose an agent that does.",
    "{0} stöder inte bilder. Välj en agent som gör det.",
    "{0} は画像入力に対応していません。対応するエージェントを選択してください。"
  ],
  "图片上传失败": [
    "圖片上傳失敗",
    "Image upload failed",
    "Bilduppladdningen misslyckades",
    "画像のアップロードに失敗しました"
  ],
  "图片上传失败，草稿已保留，请重试。": [
    "圖片上傳失敗，草稿已保留，請重試。",
    "Image upload failed. Your draft is saved; try again.",
    "Bilduppladdningen misslyckades. Utkastet är sparat; försök igen.",
    "画像のアップロードに失敗しました。下書きを保持しています。再試行してください。"
  ],
  "选择图片": [
    "選擇圖片",
    "Choose images",
    "Välj bilder",
    "画像を選択"
  ],
  "不想批准的话，告诉 {0} 换个做法": [
    "不想批准的話，告訴 {0} 換個做法",
    "Ask {0} to try another approach if you don't want to approve",
    "Be {0} prova ett annat sätt om du inte vill godkänna",
    "承認しない場合は、{0} に別の方法を伝えてください"
  ],
  "给 {0} 发消息": [
    "給 {0} 發訊息",
    "Message {0}",
    "Meddela {0}",
    "{0} にメッセージを送信"
  ],
  "消息": [
    "訊息",
    "Message",
    "Meddelande",
    "メッセージ"
  ],
  "上传中…": [
    "上傳中…",
    "Uploading…",
    "Laddar upp…",
    "アップロード中…"
  ],
  "额度剩": [
    "額度剩",
    "Quota left",
    "Återstående kvot",
    "残りの使用枠"
  ],
  "排队": [
    "排隊",
    "Queued",
    "I kö",
    "送信待ち"
  ],
  "条": [
    "條",
    "messages",
    "meddelanden",
    "件"
  ],
  "添加图片": [
    "新增圖片",
    "Add images",
    "Lägg till bilder",
    "画像を追加"
  ],
  "添加图片（可粘贴或拖入图片，最多 4 张）": [
    "新增圖片（可貼上或拖入圖片，最多 4 張）",
    "Add images (paste or drag, up to 4)",
    "Lägg till bilder (klistra in eller dra, högst 4)",
    "画像を追加（貼り付け・ドラッグ可、最大4枚）"
  ],
  "上下文已用 {0}%{1}\n{2}{3}": [
    "上下文已用 {0}%{1}\n{2}{3}",
    "Context used {0}%{1}\n{2}{3}",
    "Använt kontext {0}%{1}\n{2}{3}",
    "コンテキスト使用率 {0}%{1}\n{2}{3}"
  ],
  "上下文": [
    "上下文",
    "Context",
    "Kontext",
    "コンテキスト"
  ],
  "发送": [
    "傳送",
    "Send",
    "Skicka",
    "送信"
  ],
  "聊天设置": [
    "聊天設定",
    "Chat settings",
    "Chattinställningar",
    "チャット設定"
  ],
  "新建": [
    "新建",
    "New",
    "Ny",
    "新規"
  ],
  "修改": [
    "修改",
    "Edit",
    "Ändra",
    "変更"
  ],
  "收起": [
    "收起",
    "Collapse",
    "Fäll ihop",
    "折りたたむ"
  ],
  "还有 {0} 行，展开": [
    "還有 {0} 行，展開",
    "Expand {0} more lines",
    "Visa ytterligare {0} rader",
    "残り {0} 行を展開"
  ],
  "收起面板": [
    "收起面板",
    "Collapse panel",
    "Fäll ihop panelen",
    "パネルを折りたたむ"
  ],
  "收起{0}": [
    "收起{0}",
    "Collapse {0}",
    "Fäll ihop {0}",
    "{0} を折りたたむ"
  ],
  "出错了，稍后再试": [
    "出錯了，稍後再試",
    "Something went wrong. Try again later.",
    "Något gick fel. Försök senare.",
    "エラーが発生しました。後でもう一度お試しください。"
  ],
  "已打开 {0}": [
    "已開啟 {0}",
    "Opened {0}",
    "Öppnade {0}",
    "{0} を開きました"
  ],
  "打开文件夹": [
    "開啟資料夾",
    "Open folder",
    "Öppna mapp",
    "フォルダーを開く"
  ],
  "关闭": [
    "關閉",
    "Close",
    "Stäng",
    "閉じる"
  ],
  "工作区就是一个项目文件夹，Agent 在里面读写文件、执行命令。": [
    "工作區就是一個專案資料夾，Agent 在裡面讀寫檔案、執行命令。",
    "A workspace is a project folder where agents read and write files and run commands.",
    "En arbetsyta är en projektmapp där agenter läser och skriver filer och kör kommandon.",
    "ワークスペースは、エージェントがファイルを読み書きし、コマンドを実行するプロジェクトフォルダーです。"
  ],
  "还没有允许的目录范围。Agent 只能访问这个范围里的文件夹，先去设置里加一个，比如放项目的 ~/projects。": [
    "還沒有允許的目錄範圍。Agent 只能訪問這個範圍裡的資料夾，先去設定里加一個，比如放專案的 ~/projects。",
    "No allowed directories yet. Agents can only access folders within this range. Add a directory in Settings, such as ~/projects.",
    "Inga tillåtna kataloger ännu. Agenter kommer bara åt mappar inom området. Lägg till en katalog i Inställningar, till exempel ~/projects.",
    "許可されたディレクトリがありません。設定で ~/projects などのディレクトリを追加してください。エージェントはその範囲内のフォルダーにのみアクセスできます。"
  ],
  "去设置": [
    "去設定",
    "Go to Settings",
    "Öppna inställningar",
    "設定を開く"
  ],
  "先选一个允许的目录：": [
    "先選一個允許的目錄：",
    "Choose an allowed directory first:",
    "Välj först en tillåten katalog:",
    "最初に許可されたディレクトリを選択："
  ],
  "‹ 上一层": [
    "‹ 上一層",
    "‹ Parent folder",
    "‹ Överordnad mapp",
    "‹ 上の階層"
  ],
  "在": [
    "在",
    "In",
    "I",
    "場所："
  ],
  "里": [
    "裡",
    "",
    "",
    ""
  ],
  "已是工作区": [
    "已是工作區",
    "Already a workspace",
    "Redan en arbetsyta",
    "ワークスペース登録済み"
  ],
  "打开 {0} 里面": [
    "開啟 {0} 裡面",
    "Open inside {0}",
    "Öppna i {0}",
    "{0} の中を開く"
  ],
  "看里面的文件夹": [
    "看裡面的資料夾",
    "View subfolders",
    "Visa undermappar",
    "サブフォルダーを表示"
  ],
  "这里面没有文件夹": [
    "這裡面沒有資料夾",
    "No folders here",
    "Inga mappar här",
    "フォルダーがありません"
  ],
  "新文件夹的名字": [
    "新資料夾的名字",
    "New folder name",
    "Namn på ny mapp",
    "新しいフォルダー名"
  ],
  "创建": [
    "建立",
    "Create",
    "Skapa",
    "作成"
  ],
  "取消": [
    "取消",
    "Cancel",
    "Avbryt",
    "キャンセル"
  ],
  "+ 新建文件夹": [
    "+ 新建資料夾",
    "+ New folder",
    "+ Ny mapp",
    "+ フォルダーを作成"
  ],
  "将打开": [
    "將開啟",
    "Will open",
    "Öppnar",
    "開くフォルダー"
  ],
  "这个文件夹已经是工作区了": [
    "這個資料夾已經是工作區了",
    "This folder is already a workspace",
    "Mappen är redan en arbetsyta",
    "このフォルダーはワークスペース登録済みです"
  ],
  "打开": [
    "開啟",
    "Open",
    "Öppna",
    "開く"
  ],
  "导出失败": [
    "匯出失敗",
    "Export failed",
    "Exporten misslyckades",
    "エクスポートに失敗しました"
  ],
  "历史会话": [
    "歷史會話",
    "History",
    "Historik",
    "会話履歴"
  ],
  "刷新历史会话": [
    "刷新歷史會話",
    "Refresh history",
    "Uppdatera historiken",
    "会話履歴を更新"
  ],
  "刷新": [
    "重新整理",
    "Refresh",
    "Uppdatera",
    "更新"
  ],
  "搜索历史会话标题或对话内容": [
    "搜尋歷史會話標題或對話內容",
    "Search conversation titles or content",
    "Sök i samtalstitlar eller innehåll",
    "会話タイトルまたは内容を検索"
  ],
  "搜索标题、对话内容": [
    "搜尋標題、對話內容",
    "Search titles and content",
    "Sök titlar och innehåll",
    "タイトル・会話内容を検索"
  ],
  "清空搜索": [
    "清空搜尋",
    "Clear search",
    "Rensa sökning",
    "検索をクリア"
  ],
  "正在搜索…": [
    "正在搜尋…",
    "Searching…",
    "Söker…",
    "検索中…"
  ],
  "{0} 个会话{1}": [
    "{0} 個會話{1}",
    "Conversations: {0}{1}",
    "Samtal: {0}{1}",
    "{0} 件の会話{1}"
  ],
  "· 还有更多，请缩小搜索范围": [
    "· 還有更多，請縮小搜尋範圍",
    "· More results available; narrow your search",
    "· Fler resultat finns; begränsa sökningen",
    "· ほかにも結果があります。検索を絞り込んでください"
  ],
  "重试": [
    "重試",
    "Retry",
    "Försök igen",
    "再試行"
  ],
  "按住 ⌥ 点击并排打开": [
    "按住 ⌥ 點選並排開啟",
    "Hold ⌥ and click to open side by side",
    "Håll ⌥ och klicka för att öppna sida vid sida",
    "⌥ を押しながらクリックすると並べて開きます"
  ],
  "继续": [
    "繼續",
    "Continue",
    "Fortsätt",
    "続ける"
  ],
  "命令行": [
    "命令列",
    "CLI",
    "Kommandorad",
    "CLI"
  ],
  "网页": [
    "網頁",
    "Web",
    "Webb",
    "ウェブ"
  ],
  "导出会话：{0}": [
    "匯出會話：{0}",
    "Export conversation: {0}",
    "Exportera samtal: {0}",
    "会話をエクスポート：{0}"
  ],
  "导出为 Markdown": [
    "匯出為 Markdown",
    "Export as Markdown",
    "Exportera som Markdown",
    "Markdown でエクスポート"
  ],
  "正在读取命令行会话…": [
    "正在讀取命令列會話…",
    "Loading CLI conversations…",
    "Läser kommandoradssamtal…",
    "CLI の会話を読み込み中…"
  ],
  "正在读取…": [
    "正在讀取…",
    "Loading…",
    "Läser in…",
    "読み込み中…"
  ],
  "没有找到匹配的会话": [
    "沒有找到匹配的會話",
    "No matching conversations",
    "Inga matchande samtal",
    "一致する会話がありません"
  ],
  "还没有历史会话": [
    "還沒有歷史會話",
    "No conversations yet",
    "Inga samtal ännu",
    "会話履歴がありません"
  ],
  "试试其他关键词，或搜索 Agent 的回复内容": [
    "試試其他關鍵詞，或搜尋 Agent 的回覆內容",
    "Try other keywords or search agent replies",
    "Prova andra sökord eller sök i agentsvar",
    "別のキーワードやエージェントの返信内容を検索してください"
  ],
  "正在重新连接，连接恢复后会更新历史列表。": [
    "正在重新連線，連線恢復後會更新歷史列表。",
    "Reconnecting. History will update when the connection returns.",
    "Återansluter. Historiken uppdateras när anslutningen är tillbaka.",
    "再接続中です。接続が戻ると履歴が更新されます。"
  ],
  "导出已保存的网页记录为 Markdown。未打开过的命令行会话仅搜索标题，打开后可搜索正文和导出。": [
    "匯出已儲存的網頁記錄為 Markdown。未開啟過的命令列會話僅搜尋標題，開啟後可搜尋正文和匯出。",
    "Export saved web conversations as Markdown. Unopened CLI conversations are searched by title only; after opening, their content can be searched and exported.",
    "Exportera sparade webbsamtal som Markdown. Oöppnade kommandoradssamtal söks bara efter titel; efter öppning kan innehållet sökas och exporteras.",
    "保存済みのウェブ会話を Markdown に出力します。未読の CLI 会話はタイトルのみ検索でき、開いた後は本文の検索とエクスポートが可能です。"
  ],
  "图片预览：{0}": [
    "圖片預覽：{0}",
    "Image preview: {0}",
    "Bildförhandsvisning: {0}",
    "画像プレビュー：{0}"
  ],
  "下载原图": [
    "下載原圖",
    "Download original",
    "Ladda ned original",
    "元画像をダウンロード"
  ],
  "关闭图片预览": [
    "關閉圖片預覽",
    "Close image preview",
    "Stäng bildförhandsvisning",
    "画像プレビューを閉じる"
  ],
  "图片无法加载，请检查文件是否还在，或重新登录后再试。": [
    "圖片無法載入，請檢查檔案是否還在，或重新登入後再試。",
    "Cannot load image. Check that the file still exists or sign in again.",
    "Kan inte läsa bilden. Kontrollera att filen finns kvar eller logga in igen.",
    "画像を読み込めません。ファイルが存在するか確認するか、再度ログインしてください。"
  ],
  "查看图片：{0}": [
    "檢視圖片：{0}",
    "View image: {0}",
    "Visa bild: {0}",
    "画像を表示：{0}"
  ],
  "图片无法加载": [
    "圖片無法載入",
    "Cannot load image",
    "Kan inte läsa bilden",
    "画像を読み込めません"
  ],
  "移除图片：{0}": [
    "移除圖片：{0}",
    "Remove image: {0}",
    "Ta bort bild: {0}",
    "画像を削除：{0}"
  ],
  "待发送的图片": [
    "待發送的圖片",
    "Images to send",
    "Bilder att skicka",
    "送信予定の画像"
  ],
  "消息图片": [
    "訊息圖片",
    "Message image",
    "Meddelandebild",
    "メッセージの画像"
  ],
  "在命令行里开的会话，已同步到这里，可以直接接着聊。": [
    "在命令列裡開的會話，已同步到這裡，可以直接接著聊。",
    "This CLI conversation is synced here. You can continue chatting.",
    "Kommandoradssamtalet är synkat hit. Du kan fortsätta chatta.",
    "CLI で開始した会話が同期されています。そのまま会話を続けられます。"
  ],
  "你": [
    "你",
    "You",
    "Du",
    "あなた"
  ],
  "等待发送": [
    "等待發送",
    "Waiting to send",
    "Väntar på att skickas",
    "送信待ち"
  ],
  "发送未完成，内容已保留": [
    "傳送未完成，內容已保留",
    "Sending incomplete. Content is saved.",
    "Sändningen är ofullständig. Innehållet är sparat.",
    "送信が完了していません。内容は保持されています"
  ],
  "结果尚未确认，请检查后再重发": [
    "結果尚未確認，請檢查後再重發",
    "Result unconfirmed. Check before resending.",
    "Resultatet är obekräftat. Kontrollera innan du skickar igen.",
    "結果が未確認です。再送する前に確認してください"
  ],
  "已停止": [
    "已停止",
    "Stopped",
    "Stoppad",
    "停止済み"
  ],
  "这一轮出错了": [
    "這一輪出錯了",
    "This turn failed",
    "Denna omgång misslyckades",
    "このターンでエラーが発生しました"
  ],
  "Agent 拒绝了这次请求": [
    "Agent 拒絕了這次請求",
    "The agent declined this request",
    "Agenten avböjde begäran",
    "エージェントが要求を拒否しました"
  ],
  "回复太长，被截断了": [
    "回覆太長，被截斷了",
    "Response truncated: too long",
    "Svaret är avkortat: för långt",
    "返信が長すぎるため省略されました"
  ],
  "步骤太多，先停在这里": [
    "步驟太多，先停在這裡",
    "Stopped after too many steps",
    "Stoppade efter för många steg",
    "ステップ数の上限に達したため停止しました"
  ],
  "改了 {0} 个文件": [
    "改了 {0} 個檔案",
    "Files changed: {0}",
    "Ändrade filer: {0}",
    "{0} ファイルを変更"
  ],
  "执行了 {0} 条命令": [
    "執行了 {0} 條命令",
    "Commands run: {0}",
    "Körda kommandon: {0}",
    "{0} コマンドを実行"
  ],
  "已工作": [
    "已工作",
    "Time spent",
    "Arbetstid",
    "作業時間"
  ],
  "已工作 {0}": [
    "已工作 {0}",
    "Time spent: {0}",
    "Arbetstid: {0}",
    "作業時間：{0}"
  ],
  "工作过程": [
    "工作過程",
    "Activity",
    "Arbetsförlopp",
    "作業の過程"
  ],
  "输入 {0}": [
    "輸入 {0}",
    "Input {0}",
    "Inmatning {0}",
    "入力 {0}"
  ],
  "输出 {0}": [
    "輸出 {0}",
    "Output {0}",
    "Utmatning {0}",
    "出力 {0}"
  ],
  "缓存 {0}": [
    "快取 {0}",
    "Cache {0}",
    "Cache {0}",
    "キャッシュ {0}"
  ],
  "思考中…": [
    "思考中…",
    "Thinking…",
    "Tänker…",
    "思考中…"
  ],
  "思考": [
    "思考",
    "Thinking",
    "Resonemang",
    "思考"
  ],
  "准备中": [
    "準備中",
    "Preparing",
    "Förbereder",
    "準備中"
  ],
  "运行中": [
    "執行中",
    "Running",
    "Körs",
    "実行中"
  ],
  "完成": [
    "完成",
    "Done",
    "Klart",
    "完了"
  ],
  "失败": [
    "失敗",
    "Failed",
    "Misslyckades",
    "失敗"
  ],
  "等你批准": [
    "等你批准",
    "Awaiting your approval",
    "Väntar på ditt godkännande",
    "あなたの承認待ち"
  ],
  "未执行": [
    "未執行",
    "Not run",
    "Inte utförd",
    "未実行"
  ],
  "执行": [
    "執行",
    "Run",
    "Kör",
    "実行"
  ],
  "删除": [
    "刪除",
    "Delete",
    "Ta bort",
    "削除"
  ],
  "已批准": [
    "已批准",
    "Approved",
    "Godkänd",
    "承認済み"
  ],
  "自动放行": [
    "自動放行",
    "Automatically allowed",
    "Tillåten automatiskt",
    "自動許可"
  ],
  "已拒绝": [
    "已拒絕",
    "Denied",
    "Nekad",
    "拒否済み"
  ],
  "已取消": [
    "已取消",
    "Cancelled",
    "Avbruten",
    "キャンセル済み"
  ],
  "你批准了": [
    "你批准了",
    "You approved",
    "Du godkände",
    "あなたが承認しました"
  ],
  "自动放行（旧记录）": [
    "自動放行（舊記錄）",
    "Automatically allowed (legacy)",
    "Tillåten automatiskt (äldre post)",
    "自動許可（過去の記録）"
  ],
  "你拒绝了": [
    "你拒絕了",
    "You denied",
    "Du nekade",
    "あなたが拒否しました"
  ],
  "Agent 图片": [
    "Agent 圖片",
    "Agent image",
    "Agentbild",
    "エージェントの画像"
  ],
  "{0}：无法加载，请检查图片路径或重新登录。": [
    "{0}：無法載入，請檢查圖片路徑或重新登入。",
    "{0}: Cannot load. Check the image path or sign in again.",
    "{0}: Kan inte läsa. Kontrollera bildsökvägen eller logga in igen.",
    "{0}：読み込めません。画像のパスを確認するか、再度ログインしてください。"
  ],
  "分支": ["分支", "Branch", "Gren", "ブランチ"],
  "图片": [
    "圖片",
    "Image",
    "Bild",
    "画像"
  ],
  "已完成": [
    "已完成",
    "Completed",
    "Slutförd",
    "完了済み"
  ],
  "会话标题": [
    "會話標題",
    "Conversation title",
    "Samtalstitel",
    "会話タイトル"
  ],
  "{0}（双击{1}）": [
    "{0}（雙擊{1}）",
    "{0} (double-click to {1})",
    "{0} (dubbelklicka för att {1})",
    "{0}（ダブルクリックで{1}）"
  ],
  "还原": [
    "還原",
    "restore",
    "återställa",
    "元に戻す"
  ],
  "放大": [
    "放大",
    "maximize",
    "maximera",
    "拡大"
  ],
  "停止": [
    "停止",
    "Stop",
    "Stoppa",
    "停止"
  ],
  "停止这一轮": [
    "停止這一輪",
    "Stop this turn",
    "Stoppa denna omgång",
    "このターンを停止"
  ],
  "更多": [
    "更多",
    "More",
    "Mer",
    "その他"
  ],
  "修改标题": [
    "修改標題",
    "Edit title",
    "Ändra titel",
    "タイトルを変更"
  ],
  "再开一个窗口": [
    "再開一個視窗",
    "Open another pane",
    "Öppna ytterligare ett fönster",
    "別のウィンドウを開く"
  ],
  "放大这个窗口": [
    "放大這個視窗",
    "Maximize this pane",
    "Maximera fönstret",
    "このウィンドウを拡大"
  ],
  "双击标题": [
    "雙擊標題",
    "Double-click the title",
    "Dubbelklicka på titeln",
    "タイトルをダブルクリック"
  ],
  "启动": [
    "啟動",
    "Start",
    "Starta",
    "起動"
  ],
  "重新启动": [
    "重新啟動",
    "Restart",
    "Starta om",
    "再起動"
  ],
  "结束会话": [
    "結束會話",
    "End conversation",
    "Avsluta samtal",
    "会話を終了"
  ],
  "结束这个会话？{0} 会停止运行，对话记录留在“历史会话”里，以后还能接着聊。": [
    "結束這個會話？{0} 會停止執行，對話記錄留在“歷史會話”裡，以後還能接著聊。",
    "End this conversation? {0} will stop. Its history will be saved so you can continue later.",
    "Avsluta samtalet? {0} stoppas. Historiken sparas så att du kan fortsätta senare.",
    "この会話を終了しますか？{0} を停止します。会話は履歴に残り、後で続けられます。"
  ],
  "关闭这个窗口": [
    "關閉這個視窗",
    "Close this pane",
    "Stäng fönstret",
    "このウィンドウを閉じる"
  ],
  "关闭窗口（会话还在后台运行，左侧点一下能再打开）": [
    "關閉視窗（會話還在後臺執行，左側點一下能再開啟）",
    "Close pane (conversation keeps running; reopen from the sidebar)",
    "Stäng fönstret (samtalet fortsätter; öppna igen i sidofältet)",
    "ウィンドウを閉じる（会話は実行を続けます。サイドバーから再度開けます）"
  ],
  "{0} 没有在运行": [
    "{0} 沒有在執行",
    "{0} is not running",
    "{0} körs inte",
    "{0} は実行されていません"
  ],
  "没有在运行。发消息或点“继续”，会接着之前的对话。": [
    "沒有在執行。發訊息或點“繼續”，會接著之前的對話。",
    "Not running. Send a message or click Continue to resume.",
    "Körs inte. Skicka ett meddelande eller klicka på Fortsätt.",
    "実行されていません。メッセージを送るか「続ける」を押すと再開します。"
  ],
  "未跟踪": [
    "未跟蹤",
    "Untracked",
    "Ospårad",
    "未追跡"
  ],
  "有冲突": [
    "有衝突",
    "Conflicted",
    "Konflikt",
    "競合あり"
  ],
  "已删除": [
    "已刪除",
    "Deleted",
    "Borttagen",
    "削除済み"
  ],
  "已重命名": [
    "已重新命名",
    "Renamed",
    "Omdöpt",
    "名前変更済み"
  ],
  "新增": [
    "新增",
    "Added",
    "Tillagd",
    "追加"
  ],
  "项目文件": [
    "專案檔案",
    "Project files",
    "Projektfiler",
    "プロジェクトのファイル"
  ],
  "刷新项目文件": [
    "重新整理專案檔案",
    "Refresh project files",
    "Uppdatera projektfiler",
    "プロジェクトのファイルを更新"
  ],
  "项目面板": [
    "專案面板",
    "Project panel",
    "Projektpanel",
    "プロジェクトパネル"
  ],
  "文件": [
    "檔案",
    "Files",
    "Filer",
    "ファイル"
  ],
  "改动": [
    "改動",
    "Changes",
    "Ändringar",
    "変更"
  ],
  "返回上一级文件夹": [
    "返回上一級資料夾",
    "Go to parent folder",
    "Gå till överordnad mapp",
    "上のフォルダーへ戻る"
  ],
  "回到项目根目录": [
    "回到專案根目錄",
    "Go to project root",
    "Gå till projektroten",
    "プロジェクトのルートへ戻る"
  ],
  "筛选当前文件夹": [
    "篩選當前資料夾",
    "Filter current folder",
    "Filtrera aktuell mapp",
    "現在のフォルダーを絞り込む"
  ],
  "筛选改动文件": [
    "篩選改動檔案",
    "Filter changed files",
    "Filtrera ändrade filer",
    "変更ファイルを絞り込む"
  ],
  "文件列表": [
    "檔案列表",
    "File list",
    "Fillista",
    "ファイル一覧"
  ],
  "改动文件列表": [
    "改動檔案列表",
    "Changed file list",
    "Lista över ändrade filer",
    "変更ファイル一覧"
  ],
  "· 已暂存": [
    "· 已暫存",
    "· Staged",
    "· Stagade",
    "· ステージ済み"
  ],
  "· 工作区": [
    "· 工作區",
    "· Working tree",
    "· Arbetskopia",
    "· 作業ツリー"
  ],
  "没有匹配的文件": [
    "沒有匹配的檔案",
    "No matching files",
    "Inga matchande filer",
    "一致するファイルがありません"
  ],
  "工作区很干净，没有改动": [
    "工作區很乾淨，沒有改動",
    "Clean workspace, no changes",
    "Ren arbetsyta, inga ändringar",
    "変更はありません"
  ],
  "这个工作区还不是 Git 仓库": [
    "這個工作區還不是 Git 倉庫",
    "This workspace is not a Git repository",
    "Arbetsytan är inget Git-arkiv",
    "このワークスペースは Git リポジトリではありません"
  ],
  "这个文件夹是空的": [
    "這個資料夾是空的",
    "This folder is empty",
    "Mappen är tom",
    "このフォルダーは空です"
  ],
  "文件较多，当前显示前 500 项。": [
    "檔案較多，當前顯示前 500 項。",
    "Showing the first 500 entries.",
    "Visar de första 500 posterna.",
    "最初の500件を表示しています。"
  ],
  "文件预览": [
    "檔案預覽",
    "File preview",
    "Filförhandsvisning",
    "ファイルプレビュー"
  ],
  "Git 差异预览": [
    "Git 差異預覽",
    "Git diff preview",
    "Förhandsvisning av Git-diff",
    "Git 差分プレビュー"
  ],
  "选择一个文件": [
    "選擇一個檔案",
    "Select a file",
    "Välj en fil",
    "ファイルを選択"
  ],
  "查看代码、文档、图片或 PDF": [
    "檢視程式碼、文件、圖片或 PDF",
    "View code, documents, images or PDFs",
    "Visa kod, dokument, bilder eller PDF",
    "コード・文書・画像・PDF を表示"
  ],
  "下载当前文件": [
    "下載當前檔案",
    "Download current file",
    "Ladda ned aktuell fil",
    "現在のファイルをダウンロード"
  ],
  "下载文件": [
    "下載檔案",
    "Download file",
    "Ladda ned fil",
    "ファイルをダウンロード"
  ],
  "正在打开文件…": [
    "正在開啟檔案…",
    "Opening file…",
    "Öppnar fil…",
    "ファイルを開いています…"
  ],
  "选择一个 Git 项目": [
    "選擇一個 Git 專案",
    "Select a Git project",
    "Välj ett Git-projekt",
    "Git プロジェクトを選択"
  ],
  "没有待查看的改动": [
    "沒有待檢視的改動",
    "No changes to review",
    "Inga ändringar att granska",
    "確認する変更はありません"
  ],
  "有文件变化时会自动更新列表": [
    "有檔案變化時會自動更新列表",
    "The list updates automatically when files change",
    "Listan uppdateras automatiskt när filer ändras",
    "ファイルが変わると一覧が自動更新されます"
  ],
  "比较范围": [
    "比較範圍",
    "Comparison scope",
    "Jämförelseområde",
    "比較範囲"
  ],
  "工作区": [
    "工作區",
    "Workspace",
    "Arbetsyta",
    "ワークスペース"
  ],
  "已暂存": [
    "已暫存",
    "Staged",
    "Stagade",
    "ステージ済み"
  ],
  "打开改动文件": [
    "開啟改動檔案",
    "Open changed file",
    "Öppna ändrad fil",
    "変更ファイルを開く"
  ],
  "打开文件": [
    "開啟檔案",
    "Open file",
    "Öppna fil",
    "ファイルを開く"
  ],
  "正在读取差异…": [
    "正在讀取差異…",
    "Loading diff…",
    "Läser diff…",
    "差分を読み込み中…"
  ],
  "文件变化会自动刷新": [
    "檔案變化會自動重新整理",
    "Updates automatically when files change",
    "Uppdateras automatiskt vid filändringar",
    "ファイルが変わると自動更新されます"
  ],
  "只读预览": [
    "只讀預覽",
    "Read-only preview",
    "Skrivskyddad förhandsvisning",
    "読み取り専用プレビュー"
  ],
  "Git 项目改动": [
    "Git 專案改動",
    "Git project changes",
    "Git-projektets ändringar",
    "Git プロジェクトの変更"
  ],
  "分支 · {0}": [
    "分支 · {0}",
    "Branch · {0}",
    "Gren · {0}",
    "ブランチ · {0}"
  ],
  "项目改动": [
    "專案改動",
    "Project changes",
    "Projektändringar",
    "プロジェクトの変更"
  ],
  "此文件暂不支持在线预览": [
    "此檔案暫不支援線上預覽",
    "Online preview is unavailable for this file",
    "Filen kan inte förhandsvisas online",
    "このファイルはオンラインプレビューに対応していません"
  ],
  "可以下载后查看；代码和文档预览上限为 2 MB": [
    "可以下載後檢視；程式碼和文件預覽上限為 2 MB",
    "Download to view. Code and document previews are limited to 2 MB.",
    "Ladda ned för att visa. Kod- och dokumentförhandsvisning är begränsad till 2 MB.",
    "ダウンロードして確認できます。コードと文書のプレビューは2 MBまでです。"
  ],
  "文件暂时无法加载": [
    "檔案暫時無法載入",
    "Cannot load file right now",
    "Kan inte läsa filen just nu",
    "現在ファイルを読み込めません"
  ],
  "请刷新重试，或下载后查看": [
    "請重新整理重試，或下載後檢視",
    "Refresh and retry, or download the file",
    "Uppdatera och försök igen, eller ladda ned filen",
    "更新して再試行するか、ダウンロードしてください"
  ],
  "PDF 预览：{0}": [
    "PDF 預覽：{0}",
    "PDF preview: {0}",
    "PDF-förhandsvisning: {0}",
    "PDF プレビュー：{0}"
  ],
  "文档显示方式": [
    "文件顯示方式",
    "Document display",
    "Dokumentvisning",
    "文書の表示方法"
  ],
  "预览": [
    "預覽",
    "Preview",
    "Förhandsvisning",
    "プレビュー"
  ],
  "源码": [
    "原始碼",
    "Source",
    "Källkod",
    "ソース"
  ],
  "文件源码": [
    "檔案原始碼",
    "File source",
    "Filens källkod",
    "ファイルのソース"
  ],
  "文件有 {0} 行，下载可查看完整内容": [
    "檔案有 {0} 行，下載可檢視完整內容",
    "This file has {0} lines. Download it to view everything.",
    "Filen har {0} rader. Ladda ned för att visa allt.",
    "全 {0} 行です。ダウンロードするとすべて確認できます"
  ],
  "展开更多 · 共 {0} 行": [
    "展開更多 · 共 {0} 行",
    "Show more · {0} lines total",
    "Visa mer · totalt {0} rader",
    "さらに表示 · 全 {0} 行"
  ],
  "这是二进制文件的改动": [
    "這是二進位制檔案的改動",
    "This is a binary file change",
    "Detta är en ändring i en binärfil",
    "バイナリファイルの変更です"
  ],
  "图片等文件可以切换到“文件”查看当前版本": [
    "圖片等檔案可以切換到“檔案”檢視當前版本",
    "Switch to Files to view the current image or file",
    "Växla till Filer för att visa aktuell bild eller fil",
    "「ファイル」に切り替えると現在の画像やファイルを表示できます"
  ],
  "这个范围内没有差异": [
    "這個範圍內沒有差異",
    "No differences in this scope",
    "Inga skillnader inom detta område",
    "この範囲に差分はありません"
  ],
  "可以切换“工作区”或“已暂存”查看": [
    "可以切換“工作區”或“已暫存”檢視",
    "Try Workspace or Staged",
    "Prova Arbetsyta eller Stagade",
    "「ワークスペース」または「ステージ済み」に切り替えてください"
  ],
  "Git 文件差异": [
    "Git 檔案差異",
    "Git file diff",
    "Git-fildiff",
    "Git ファイル差分"
  ],
  "差异超过 10000 行，请在终端查看完整内容": [
    "差異超過 10000 行，請在終端檢視完整內容",
    "Diff exceeds 10,000 lines. View the full diff in a terminal.",
    "Diffen överstiger 10 000 rader. Visa hela i terminalen.",
    "差分が10000行を超えています。すべての内容はターミナルで確認してください"
  ],
  "暂无选项": [
    "暫無選項",
    "No options",
    "Inga alternativ",
    "選択肢がありません"
  ],
  "{0} 正在工作，结束会打断它。结束这个会话吗？记录会留在“历史会话”里。": [
    "{0} 正在工作，結束會打斷它。結束這個會話嗎？記錄會留在“歷史會話”裡。",
    "{0} is working. Ending this conversation will interrupt it. History will be saved. Continue?",
    "{0} arbetar. Om du avslutar avbryts arbetet. Historiken sparas. Fortsätta?",
    "{0} は作業中です。会話を終了すると作業を中断します。履歴は保存されます。終了しますか？"
  ],
  "工作区与会话": [
    "工作區與會話",
    "Workspaces and conversations",
    "Arbetsytor och samtal",
    "ワークスペースと会話"
  ],
  "收起导航": [
    "收起導航",
    "Collapse navigation",
    "Fäll ihop navigering",
    "ナビゲーションを閉じる"
  ],
  "导航": [
    "導航",
    "Navigation",
    "Navigering",
    "ナビゲーション"
  ],
  "启动 Agent": [
    "啟動 Agent",
    "Start agent",
    "Starta agent",
    "エージェントを起動"
  ],
  "启动本机 Agent": [
    "啟動本機 Agent",
    "Start local agent",
    "Starta lokal agent",
    "ローカルエージェントを起動"
  ],
  "里启动": [
    "裡啟動",
    "Start in",
    "Starta i",
    "起動先"
  ],
  "启动 {0}": [
    "啟動 {0}",
    "Start {0}",
    "Starta {0}",
    "{0} を起動"
  ],
  "当前没有可启动的本机 Agent。": [
    "當前沒有可啟動的本機 Agent。",
    "No local agents available to start.",
    "Inga lokala agenter kan startas.",
    "起動可能なローカルエージェントがありません。"
  ],
  "Agent 要在一个文件夹里干活，先打开一个文件夹。": [
    "Agent 要在一個資料夾裡幹活，先開啟一個資料夾。",
    "Agents need a folder to work in. Open a folder first.",
    "Agenter behöver en arbetsmapp. Öppna en mapp först.",
    "エージェントには作業フォルダーが必要です。最初にフォルダーを開いてください。"
  ],
  "连接恢复后可启动或重新扫描。": [
    "連線恢復後可啟動或重新掃描。",
    "Start or scan again after reconnecting.",
    "Starta eller skanna igen efter återanslutning.",
    "再接続後に起動または再スキャンできます。"
  ],
  "重新扫描": [
    "重新掃描",
    "Scan again",
    "Skanna igen",
    "再スキャン"
  ],
  "管理 Agent": [
    "管理 Agent",
    "Manage agents",
    "Hantera agenter",
    "エージェントを管理"
  ],
  "，{0} 个会话等你": [
    "，{0} 個會話等你",
    ", {0} conversations need you",
    ", {0} samtal väntar på dig",
    "、{0} 件の会話があなたを待っています"
  ],
  "，有 Agent 工作中": [
    "，有 Agent 工作中",
    ", agents are working",
    ", agenter arbetar",
    "、エージェントが作業中"
  ],
  "默认目录": [
    "預設目錄",
    "Default directory",
    "Standardkatalog",
    "既定のディレクトリ"
  ],
  "当前会话": [
    "當前會話",
    "Current conversation",
    "Aktuellt samtal",
    "現在の会話"
  ],
  "回复已完成，查看最新内容后熄灯": [
    "回覆已完成，檢視最新內容後熄燈",
    "Response complete. Read the latest content to clear the indicator.",
    "Svaret är klart. Läs det senaste för att släcka indikatorn.",
    "返信が完了しました。最新の内容を読むとランプが消えます"
  ],
  "{0} · {1}\n按住 ⌥ 点击并排打开，双击修改标题": [
    "{0} · {1}\n按住 ⌥ 點選並排開啟，雙擊修改標題",
    "{0} · {1}\nHold ⌥ and click to open side by side; double-click to rename",
    "{0} · {1}\nHåll ⌥ och klicka för parallell vy; dubbelklicka för att byta namn",
    "{0} · {1}\n⌥ を押しながらクリックで並列表示、ダブルクリックでタイトル変更"
  ],
  "结束会话：{0}": [
    "結束會話：{0}",
    "End conversation: {0}",
    "Avsluta samtal: {0}",
    "会話を終了：{0}"
  ],
  "结束会话（记录留在“历史会话”里）": [
    "結束會話（記錄留在“歷史會話”裡）",
    "End conversation (history is saved)",
    "Avsluta samtal (historiken sparas)",
    "会話を終了（履歴は保存されます）"
  ],
  "设置": [
    "設定",
    "Settings",
    "Inställningar",
    "設定"
  ],
  "已连接 · 会话持续在后台运行": [
    "已連線 · 會話持續在後臺執行",
    "Connected · Conversations keep running in the background",
    "Ansluten · Samtalen fortsätter i bakgrunden",
    "接続済み · 会話はバックグラウンドで実行を続けます"
  ],
  "连接中 · 正在恢复会话": [
    "連線中 · 正在恢復會話",
    "Connecting · Restoring conversations",
    "Ansluter · Återställer samtal",
    "接続中 · 会話を復元しています"
  ],
  "等你": [
    "等你",
    "Needs you",
    "Väntar på dig",
    "あなたを待っています"
  ],
  "工作中": [
    "工作中",
    "Working",
    "Arbetar",
    "作業中"
  ],
  "空闲": [
    "空閒",
    "Idle",
    "Inaktiv",
    "待機中"
  ],
  "出错": [
    "出錯",
    "Error",
    "Fel",
    "エラー"
  ],
  "已等 {0}": [
    "已等 {0}",
    "Waiting {0}",
    "Väntat {0}",
    "{0} 待機しています"
  ],
  "已等不到 1 分钟": [
    "已等不到 1 分鐘",
    "Waiting less than 1 minute",
    "Väntat mindre än 1 minut",
    "待機時間は1分未満です"
  ],
  "工作台": [
    "工作臺",
    "Workbench",
    "Arbetsbänk",
    "ワークベンチ"
  ],
  "当前工作区：{0}": [
    "當前工作區：{0}",
    "Current workspace: {0}",
    "Aktuell arbetsyta: {0}",
    "現在のワークスペース：{0}"
  ],
  "尚未选择": [
    "尚未選擇",
    "Not selected",
    "Inte vald",
    "未選択"
  ],
  "选择工作区": [
    "選擇工作區",
    "Select workspace",
    "Välj arbetsyta",
    "ワークスペースを選択"
  ],
  "{0} {1} 个会话": [
    "{0} {1} 個會話",
    "{0} · Conversations: {1}",
    "{0} · Samtal: {1}",
    "{0} {1} 件の会話"
  ],
  "当前项目工具": [
    "當前專案工具",
    "Current project tools",
    "Aktuella projektverktyg",
    "現在のプロジェクトツール"
  ],
  "浏览项目文件": [
    "瀏覽專案檔案",
    "Browse project files",
    "Bläddra bland projektfiler",
    "プロジェクトのファイルを参照"
  ],
  "查看项目改动": [
    "檢視專案改動",
    "View project changes",
    "Visa projektändringar",
    "プロジェクトの変更を表示"
  ],
  "所有工作区": [
    "所有工作區",
    "All workspaces",
    "Alla arbetsytor",
    "すべてのワークスペース"
  ],
  "所有工作区状态汇总": [
    "所有工作區狀態彙總",
    "Status across all workspaces",
    "Status för alla arbetsytor",
    "すべてのワークスペースの状態"
  ],
  "{0} {1} 个会话，点击查看下一个": [
    "{0} {1} 個會話，點選檢視下一個",
    "{0} · Conversations: {1}; click to view the next",
    "{0} · Samtal: {1}; klicka för nästa",
    "{0} {1} 件の会話、クリックで次を表示"
  ],
  "Agent 状态看板": [
    "Agent 狀態看板",
    "Agent status board",
    "Agenternas statusöversikt",
    "エージェントの状態ボード"
  ],
  "全局动态": [
    "全域性動態",
    "Activity overview",
    "Aktivitetsöversikt",
    "全体の動き"
  ],
  "进行中和待查看的会话": [
    "進行中和待檢視的會話",
    "Active and unread conversations",
    "Aktiva och olästa samtal",
    "進行中・未読の会話"
  ],
  "已完成 · 未读": [
    "已完成 · 未讀",
    "Completed · Unread",
    "Slutfört · Oläst",
    "完了 · 未読"
  ],
  "当前没有进行中的会话": [
    "當前沒有進行中的會話",
    "No active conversations",
    "Inga aktiva samtal",
    "進行中の会話はありません"
  ],
  "浅色模式": [
    "淺色模式",
    "Light mode",
    "Ljust läge",
    "ライトモード"
  ],
  "深色模式": [
    "深色模式",
    "Dark mode",
    "Mörkt läge",
    "ダークモード"
  ],
  "跟随系统": [
    "跟隨系統",
    "Use system setting",
    "Följ systemet",
    "システム設定に従う"
  ],
  "外观配色": [
    "外觀配色",
    "Appearance",
    "Utseende",
    "外観"
  ],
  "从一个工作区开始": [
    "從一個工作區開始",
    "Start with a workspace",
    "Börja med en arbetsyta",
    "ワークスペースから始めましょう"
  ],
  "继续你的工作": [
    "繼續你的工作",
    "Continue your work",
    "Fortsätt ditt arbete",
    "作業を続けましょう"
  ],
  "开始一个新任务": [
    "開始一個新任務",
    "Start a new task",
    "Starta en ny uppgift",
    "新しいタスクを開始"
  ],
  "准备好你的 Agent": [
    "準備好你的 Agent",
    "Prepare your agents",
    "Förbered dina agenter",
    "エージェントを準備"
  ],
  "打开项目文件夹，让 Agent 在这里与你协作。": [
    "開啟專案資料夾，讓 Agent 在這裡與你協作。",
    "Open a project folder to work with agents here.",
    "Öppna en projektmapp och samarbeta med agenter här.",
    "プロジェクトフォルダーを開いて、エージェントと作業しましょう。"
  ],
  "打开已有会话，或选择一个 Agent 开始新的任务。": [
    "開啟已有會話，或選擇一個 Agent 開始新的任務。",
    "Open an existing conversation or choose an agent for a new task.",
    "Öppna ett befintligt samtal eller välj en agent för en ny uppgift.",
    "既存の会話を開くか、エージェントを選んで新しいタスクを始めましょう。"
  ],
  "打开已有会话继续工作，也可以在设置中配置新的 Agent。": [
    "開啟已有會話繼續工作，也可以在設定中配置新的 Agent。",
    "Continue an existing conversation, or configure new agents in Settings.",
    "Fortsätt ett samtal eller konfigurera nya agenter i Inställningar.",
    "既存の会話を続けるか、設定で新しいエージェントを構成できます。"
  ],
  "选择一个 Agent，一起完成项目里的下一件事。": [
    "選擇一個 Agent，一起完成專案裡的下一件事。",
    "Choose an agent for your next project task.",
    "Välj en agent för projektets nästa uppgift.",
    "エージェントを選んでプロジェクトの次の作業を進めましょう。"
  ],
  "先在设置中安装或启用一个 Agent，再开始对话。": [
    "先在設定中安裝或啟用一個 Agent，再開始對話。",
    "Install or enable an agent in Settings first.",
    "Installera eller aktivera en agent i Inställningar först.",
    "最初に設定でエージェントをインストールまたは有効化してください。"
  ],
  "开始工作": [
    "開始工作",
    "Get started",
    "Börja arbeta",
    "作業を開始"
  ],
  "连接工作台": [
    "連線工作臺",
    "Connect to workbench",
    "Anslut till arbetsbänken",
    "ワークベンチに接続"
  ],
  "正在连接工作台…": [
    "正在連線工作臺…",
    "Connecting to workbench…",
    "Ansluter till arbetsbänken…",
    "ワークベンチに接続中…"
  ],
  "继续 {0} 会话：{1}，{2}": [
    "繼續 {0} 會話：{1}，{2}",
    "Continue {0} conversation: {1}, {2}",
    "Fortsätt {0}-samtal: {1}, {2}",
    "{0} の会話を続ける：{1}、{2}"
  ],
  "开始新会话": [
    "開始新會話",
    "New conversation",
    "Nytt samtal",
    "新しい会話"
  ],
  "选择 Agent 开始新会话": [
    "選擇 Agent 開始新會話",
    "Choose an agent for a new conversation",
    "Välj agent för ett nytt samtal",
    "エージェントを選択して新しい会話を開始"
  ],
  "配置 Agent": [
    "配置 Agent",
    "Configure agents",
    "Konfigurera agenter",
    "エージェントを設定"
  ],
  "连接恢复后即可启动新会话。": [
    "連線恢復後即可啟動新會話。",
    "New conversations can start after reconnecting.",
    "Nya samtal kan startas efter återanslutning.",
    "再接続後に新しい会話を開始できます。"
  ],
  "检查完了": [
    "檢查完了",
    "Check complete",
    "Kontrollen klar",
    "確認が完了しました"
  ],
  "扫描完成": [
    "掃描完成",
    "Scan complete",
    "Skanningen klar",
    "スキャンが完了しました"
  ],
  "全部": [
    "全部",
    "All",
    "Alla",
    "すべて"
  ],
  "已安装": [
    "已安裝",
    "Installed",
    "Installerade",
    "インストール済み"
  ],
  "国内": [
    "國內",
    "China",
    "Kina",
    "中国"
  ],
  "国外 / 开源": [
    "國外 / 開源",
    "Global / Open source",
    "Globalt / Öppen källkod",
    "海外 / オープンソース"
  ],
  "Agent 管理": [
    "Agent 管理",
    "Agent management",
    "Agenthantering",
    "エージェント管理"
  ],
  "管理本机的 Agent，连接常用的模型。": [
    "管理本機的 Agent，連線常用的模型。",
    "Manage local agents and connect your models.",
    "Hantera lokala agenter och anslut dina modeller.",
    "ローカルエージェントを管理し、モデルを接続します。"
  ],
  "正在检查…": [
    "正在檢查…",
    "Checking…",
    "Kontrollerar…",
    "確認中…"
  ],
  "检查更新": [
    "檢查更新",
    "Check for updates",
    "Sök efter uppdateringar",
    "更新を確認"
  ],
  "正在扫描…": [
    "正在掃描…",
    "Scanning…",
    "Skannar…",
    "スキャン中…"
  ],
  "扫描本机": [
    "掃描本機",
    "Scan this server",
    "Skanna servern",
    "サーバーをスキャン"
  ],
  "已连接": [
    "已連線",
    "Connected",
    "Anslutna",
    "接続済み"
  ],
  "个已安装": [
    "個已安裝",
    "installed",
    "installerade",
    "個インストール済み"
  ],
  "个 Agent": [
    "個 Agent",
    "agents",
    "agenter",
    "個のエージェント"
  ],
  "安装后，登录或配置模型，再测试连接": [
    "安裝後，登入或配置模型，再測試連線",
    "After installation, sign in or configure a model, then test the connection",
    "Logga in eller konfigurera en modell efter installation och testa sedan anslutningen",
    "インストール後にログインまたはモデルを設定し、接続をテストしてください"
  ],
  "Agent 分类": [
    "Agent 分類",
    "Agent categories",
    "Agentkategorier",
    "エージェントの分類"
  ],
  "搜索 Agent": [
    "搜尋 Agent",
    "Search agents",
    "Sök agenter",
    "エージェントを検索"
  ],
  "搜索名称或厂商": [
    "搜尋名稱或廠商",
    "Search names or publishers",
    "Sök namn eller utgivare",
    "名前・提供元で検索"
  ],
  "清空 Agent 搜索": [
    "清空 Agent 搜尋",
    "Clear agent search",
    "Rensa agentsökning",
    "エージェント検索をクリア"
  ],
  "找到": [
    "找到",
    "Found",
    "Hittade",
    "検索結果："
  ],
  "本机已安装": [
    "本機已安裝",
    "Installed on this server",
    "Installerade på servern",
    "サーバーにインストール済み"
  ],
  "更多 Agent": [
    "更多 Agent",
    "More agents",
    "Fler agenter",
    "その他のエージェント"
  ],
  "没有找到匹配的 Agent，试试其他名称或分类。": [
    "沒有找到匹配的 Agent，試試其他名稱或分類。",
    "No matching agents. Try another name or category.",
    "Inga matchande agenter. Prova ett annat namn eller en annan kategori.",
    "一致するエージェントがありません。別の名前や分類をお試しください。"
  ],
  "显示全部": [
    "顯示全部",
    "Show all",
    "Visa alla",
    "すべて表示"
  ],
  "安装中": [
    "安裝中",
    "Installing",
    "Installerar",
    "インストール中"
  ],
  "更新中": [
    "更新中",
    "Updating",
    "Uppdaterar",
    "更新中"
  ],
  "已停用": [
    "已停用",
    "Disabled",
    "Inaktiverad",
    "無効"
  ],
  "未安装": [
    "未安裝",
    "Not installed",
    "Inte installerad",
    "未インストール"
  ],
  "待安装": [
    "待安裝",
    "Installation needed",
    "Behöver installeras",
    "インストールが必要"
  ],
  "待登录": [
    "待登入",
    "Sign-in needed",
    "Behöver inloggning",
    "ログインが必要"
  ],
  "连接异常": [
    "連線異常",
    "Connection error",
    "Anslutningsfel",
    "接続エラー"
  ],
  "待测试": [
    "待測試",
    "Not tested",
    "Inte testad",
    "未テスト"
  ],
  "查看": [
    "檢視",
    "View",
    "Visa",
    "表示"
  ],
  "更新": [
    "更新",
    "Update",
    "Uppdatera",
    "更新"
  ],
  "安装": [
    "安裝",
    "Install",
    "Installera",
    "インストール"
  ],
  "{0} {1} 设置": [
    "{0} {1} 設定",
    "{0} {1} settings",
    "{0} {1} inställningar",
    "{0} {1} 設定"
  ],
  "展开": [
    "展開",
    "Expand",
    "Fäll ut",
    "展開"
  ],
  "可更新": [
    "可更新",
    "Update available",
    "Uppdatering finns",
    "更新あり"
  ],
  "{0} 设置": [
    "{0} 設定",
    "{0} settings",
    "Inställningar för {0}",
    "{0} の設定"
  ],
  "还不知道": [
    "還不知道",
    "Not known yet",
    "Ännu okänt",
    "まだ確認されていません"
  ],
  "点下面的“测试连接”，就知道它登录没有、支持哪些登录方式。": [
    "點下面的“測試連線”，就知道它登入沒有、支援哪些登入方式。",
    "Click Test connection to check login and available sign-in methods.",
    "Klicka på Testa anslutning för att kontrollera inloggning och inloggningssätt.",
    "「接続をテスト」でログイン状態と利用可能なログイン方法を確認できます。"
  ],
  "要重新测试": [
    "要重新測試",
    "Test again",
    "Testa igen",
    "再テストが必要"
  ],
  "下面是更新前的测试结果，那时还不记登录方式。点“测试连接”再测一次。": [
    "下面是更新前的測試結果，那時還不記登入方式。點“測試連線”再測一次。",
    "These results predate the update and don't include sign-in methods. Test again.",
    "Resultaten är från före uppdateringen och saknar inloggningssätt. Testa igen.",
    "更新前のテスト結果にはログイン方法が含まれていません。再度テストしてください。"
  ],
  "已登录": [
    "已登入",
    "Signed in",
    "Inloggad",
    "ログイン済み"
  ],
  "想换账号、换 Key 或换模型供应商，点“重新登录”。": [
    "想換賬號、換 Key 或換模型供應商，點“重新登入”。",
    "To change account, key or provider, click Sign in again.",
    "Klicka på Logga in igen för att byta konto, nyckel eller leverantör.",
    "アカウント、キー、プロバイダーを変更するには「再ログイン」を押してください。"
  ],
  "还没登录": [
    "還沒登入",
    "Not signed in",
    "Inte inloggad",
    "未ログイン"
  ],
  "点“登录”，用它自己提供的方式登录。": [
    "點“登入”，用它自己提供的方式登入。",
    "Click Sign in to use the agent's own login method.",
    "Klicka på Logga in för agentens eget inloggningssätt.",
    "「ログイン」でエージェント自身のログイン方法を利用できます。"
  ],
  "它没有提供网页上的登录方式，请在服务器终端里登录或配置模型供应商。": [
    "它沒有提供網頁上的登入方式，請在伺服器終端裡登入或配置模型供應商。",
    "No web sign-in method is available. Sign in or configure a provider in the server terminal.",
    "Ingen webbinloggning finns. Logga in eller konfigurera en leverantör i serverns terminal.",
    "ウェブでのログイン方法がありません。サーバーのターミナルでログインまたはプロバイダーを設定してください。"
  ],
  "没连上": [
    "沒連上",
    "Not connected",
    "Inte ansluten",
    "未接続"
  ],
  "先看下面测试连接卡在哪一步。也可以点“登录”，在里面把它配置好再测。": [
    "先看下面測試連線卡在哪一步。也可以點“登入”，在裡面把它配置好再測。",
    "Check the failing test step below. You can also sign in and configure the agent before retesting.",
    "Kontrollera det misslyckade teststeget nedan. Du kan också logga in och konfigurera agenten före nästa test.",
    "下の接続テストで失敗した段階を確認してください。ログインして設定した後、再テストすることもできます。"
  ],
  "它没能启动起来，所以还不知道怎么登录。先看下面测试连接卡在哪一步，处理好再测一次。": [
    "它沒能啟動起來，所以還不知道怎麼登入。先看下面測試連線卡在哪一步，處理好再測一次。",
    "The agent couldn't start, so sign-in methods are unknown. Resolve the test failure below and try again.",
    "Agenten kunde inte starta, så inloggningssätten är okända. Åtgärda testfelet nedan och försök igen.",
    "エージェントが起動できず、ログイン方法を確認できません。下のテスト結果を確認して再試行してください。"
  ],
  "Agent 连接已通过": [
    "Agent 連線已通過",
    "Agent connection passed",
    "Agentanslutningen godkänd",
    "エージェントの接続確認に成功"
  ],
  "使用接口 Key": [
    "使用介面 Key",
    "Using an API key",
    "Använder API-nyckel",
    "API キーを使用中"
  ],
  "当前使用 {0} 的接口配置。要使用原生订阅账号，先在“模型接入”中恢复 Agent 原有配置。": [
    "當前使用 {0} 的介面配置。要使用原生訂閱賬號，先在“模型接入”中恢復 Agent 原有配置。",
    "Using {0}'s API configuration. Restore the agent's own configuration in Model access to use its subscription account.",
    "Använder API-inställningen för {0}. Återställ agentens egen konfiguration under Modellanslutning för abonnemangskontot.",
    "{0} の API 設定を使用中です。サブスクリプションのアカウントを使うには「モデル接続」でエージェント本来の設定に戻してください。"
  ],
  "连接能力": [
    "連線能力",
    "Capabilities",
    "Funktioner",
    "対応機能"
  ],
  "接着聊": [
    "接著聊",
    "Resume conversations",
    "Återuppta samtal",
    "会話を再開"
  ],
  "切换模型": [
    "切換模型",
    "Switch models",
    "Byta modell",
    "モデル切り替え"
  ],
  "，支持": [
    "，支援",
    "; supports",
    "; stöder",
    "、対応："
  ],
  "，不支持": [
    "，不支援",
    "; does not support",
    "; stöder inte",
    "、非対応："
  ],
  "测试连接后，显示这个 Agent 支持的能力。": [
    "測試連線後，顯示這個 Agent 支援的能力。",
    "Test the connection to see this agent's capabilities.",
    "Testa anslutningen för att se agentens funktioner.",
    "接続をテストすると、対応機能が表示されます。"
  ],
  "启动命令": [
    "啟動命令",
    "Launch command",
    "Startkommando",
    "起動コマンド"
  ],
  "项目资料": [
    "專案資料",
    "Project information",
    "Projektinformation",
    "プロジェクト情報"
  ],
  "官网与文档 ↗": [
    "官網與文件 ↗",
    "Website and docs ↗",
    "Webbplats och dokumentation ↗",
    "公式サイト・ドキュメント ↗"
  ],
  "重新登录": [
    "重新登入",
    "Sign in again",
    "Logga in igen",
    "再ログイン"
  ],
  "当前模型": [
    "當前模型",
    "Current model",
    "Aktuell modell",
    "現在のモデル"
  ],
  "没有配置文件": [
    "沒有配置檔案",
    "No configuration file",
    "Ingen konfigurationsfil",
    "設定ファイルがありません"
  ],
  "Agent 自己的默认": [
    "Agent 自己的預設",
    "Agent default",
    "Agentens standard",
    "エージェントの既定値"
  ],
  "读自": [
    "讀自",
    "Read from",
    "Läst från",
    "読み取り元："
  ],
  "（只读，不会改它）。Agent 只在启动时读配置：改了模型，开着的会话不变，新开的会话才生效。": [
    "（只讀，不會改它）。Agent 只在啟動時讀配置：改了模型，開著的會話不變，新開的會話才生效。",
    "(read-only). Agents read configuration at startup. Model changes apply only to new conversations.",
    "(skrivskyddat). Agenter läser konfiguration vid start. Modelländringar gäller bara nya samtal.",
    "（読み取り専用）。設定は起動時に読み込まれます。モデル変更は新しい会話から適用されます。"
  ],
  "启用": [
    "啟用",
    "Enabled",
    "Aktiverad",
    "有効"
  ],
  "点一下停用": [
    "點一下停用",
    "Click to disable",
    "Klicka för att inaktivera",
    "クリックで無効化"
  ],
  "点一下启用": [
    "點一下啟用",
    "Click to enable",
    "Klicka för att aktivera",
    "クリックで有効化"
  ],
  "启用 {0}": [
    "啟用 {0}",
    "Enable {0}",
    "Aktivera {0}",
    "{0} を有効化"
  ],
  "已启用 {0}": [
    "已啟用 {0}",
    "Enabled {0}",
    "Aktiverade {0}",
    "{0} を有効にしました"
  ],
  "已停用 {0}": [
    "已停用 {0}",
    "Disabled {0}",
    "Inaktiverade {0}",
    "{0} を無効にしました"
  ],
  "停用后不出现在“启动 Agent”菜单和历史会话里，开着的会话不受影响。": [
    "停用後不出現在“啟動 Agent”選單和歷史會話裡，開著的會話不受影響。",
    "Disabled agents are hidden from the launch menu and history. Open conversations are unaffected.",
    "Inaktiverade agenter döljs i startmenyn och historiken. Öppna samtal påverkas inte.",
    "無効化すると起動メニューと履歴から非表示になります。開いている会話には影響しません。"
  ],
  "正在测试…": [
    "正在測試…",
    "Testing…",
    "Testar…",
    "テスト中…"
  ],
  "测试连接": [
    "測試連線",
    "Test connection",
    "Testa anslutning",
    "接続をテスト"
  ],
  "上次测试：": [
    "上次測試：",
    "Last test:",
    "Senaste test:",
    "前回のテスト："
  ],
  "正在测试：启动进程 → 握手 → 新建会话。第一次用 npx 启动的 Agent 要先下载，会慢一些。": [
    "正在測試：啟動程序 → 握手 → 新建會話。第一次用 npx 啟動的 Agent 要先下載，會慢一些。",
    "Testing: start process → handshake → new conversation. First-time npx downloads may take longer.",
    "Testar: starta process → handskakning → nytt samtal. Första npx-nedladdningen kan ta längre tid.",
    "テスト中：プロセス起動 → ハンドシェイク → 会話作成。初回の npx ダウンロードには時間がかかる場合があります。"
  ],
  "启动进程": [
    "啟動程序",
    "Start process",
    "Starta process",
    "プロセス起動"
  ],
  "握手": [
    "握手",
    "Handshake",
    "Handskakning",
    "ハンドシェイク"
  ],
  "新建会话": [
    "新建會話",
    "New conversation",
    "Nytt samtal",
    "新しい会話"
  ],
  "{0} 毫秒": [
    "{0} 毫秒",
    "{0} ms",
    "{0} ms",
    "{0} ミリ秒"
  ],
  "{0} 秒": [
    "{0} 秒",
    "{0} sec",
    "{0} sek",
    "{0} 秒"
  ],
  "在服务器上运行": [
    "在伺服器上執行",
    "Run on server",
    "Kör på servern",
    "サーバーで実行"
  ],
  "正在": [
    "正在",
    "Currently",
    "Pågår:",
    "実行中："
  ],
  "上次": [
    "上次",
    "Last",
    "Senaste",
    "前回"
  ],
  "没成功": [
    "沒成功",
    "Failed",
    "Misslyckades",
    "失敗"
  ],
  "查看输出": [
    "檢視輸出",
    "View output",
    "Visa utdata",
    "出力を表示"
  ],
  "正在装别的 Agent，一次只做一件": [
    "正在裝別的 Agent，一次只做一件",
    "Another agent is being installed. One operation at a time.",
    "En annan agent installeras. En åtgärd i taget.",
    "別のエージェントをインストール中です。完了までお待ちください"
  ],
  "项目自带": [
    "專案自帶",
    "Bundled",
    "Medföljer",
    "同梱"
  ],
  "项目自带，跟着 Fika Desk 一起安装和更新。": [
    "專案自帶，跟著 Fika Desk 一起安裝和更新。",
    "Bundled with Fika Desk; installed and updated together.",
    "Medföljer Fika Desk och installeras och uppdateras tillsammans.",
    "Fika Desk に同梱され、一緒にインストール・更新されます。"
  ],
  "还没装": [
    "還沒裝",
    "Not installed yet",
    "Inte installerad ännu",
    "まだインストールされていません"
  ],
  "会在服务器上运行": [
    "會在伺服器上執行",
    "Will run on the server",
    "Körs på servern",
    "サーバーで実行するコマンド"
  ],
  "手动安装：": [
    "手動安裝：",
    "Manual installation:",
    "Manuell installation:",
    "手動インストール："
  ],
  "更新时会运行：{0}": [
    "更新時會執行：{0}",
    "Update command: {0}",
    "Uppdateringskommando: {0}",
    "更新コマンド：{0}"
  ],
  "检查更新没成功：{0}": [
    "檢查更新沒成功：{0}",
    "Update check failed: {0}",
    "Uppdateringskontrollen misslyckades: {0}",
    "更新の確認に失敗しました：{0}"
  ],
  "有新版本：{0}": [
    "有新版本：{0}",
    "New version: {0}",
    "Ny version: {0}",
    "新しいバージョン：{0}"
  ],
  "已经是最新版本（{0}查的）": [
    "已經是最新版本（{0}查的）",
    "Already up to date (checked {0})",
    "Redan senaste versionen (kontrollerat {0})",
    "最新バージョンです（{0} 確認）"
  ],
  "正在检查有没有新版本…": [
    "正在檢查有沒有新版本…",
    "Checking for a new version…",
    "Söker efter ny version…",
    "新しいバージョンを確認中…"
  ],
  "版本": [
    "版本",
    "Version",
    "Version",
    "バージョン"
  ],
  "还没读到。": [
    "還沒讀到。",
    "Not available yet.",
    "Inte tillgängligt ännu.",
    "まだ読み取れていません。"
  ],
  "用 API Key 登录：按用量计费，没有额度限制": [
    "用 API Key 登入：按用量計費，沒有額度限制",
    "API key login: usage-based billing, no subscription quota",
    "API-nyckelinloggning: användningsbaserad debitering, ingen abonnemangskvot",
    "API キーでログイン：従量課金、サブスクリプションの使用枠は適用されません"
  ],
  "读不到用量": [
    "讀不到用量",
    "Cannot read usage",
    "Kan inte läsa användning",
    "使用量を取得できません"
  ],
  "账号": [
    "賬號",
    "Account",
    "Konto",
    "アカウント"
  ],
  "剩": [
    "剩",
    "Remaining",
    "Återstår",
    "残り"
  ],
  "重置": [
    "重置",
    "Reset",
    "Återställning",
    "リセット"
  ],
  "积分 {0}": [
    "積分 {0}",
    "Credits {0}",
    "Krediter {0}",
    "クレジット {0}"
  ],
  "还有 {0} 次免费重置额度": [
    "還有 {0} 次免費重置額度",
    "Free quota resets remaining: {0}",
    "Återstående kostnadsfria kvotåterställningar: {0}",
    "無料の使用枠リセット：残り {0} 回"
  ],
  "账号用量": [
    "賬號用量",
    "Account usage",
    "Kontoanvändning",
    "アカウントの使用量"
  ],
  "读的": [
    "讀的",
    "Read",
    "Läst",
    "取得"
  ],
  "没走到": [
    "沒走到",
    "Not reached",
    "Inte nått",
    "未実行"
  ],
  "连接成功": [
    "連線成功",
    "Connection successful",
    "Anslutningen lyckades",
    "接続に成功しました"
  ],
  "，当前模型 {0}": [
    "，當前模型 {0}",
    ", current model {0}",
    ", aktuell modell {0}",
    "、現在のモデル：{0}"
  ],
  "这个 Agent 在服务器上还没登录。通过上面的“登录”或服务器终端完成登录，然后再测一次。": [
    "這個 Agent 在伺服器上還沒登入。通過上面的“登入”或伺服器終端完成登入，然後再測一次。",
    "This agent is not signed in on the server. Sign in above or in the terminal, then test again.",
    "Agenten är inte inloggad på servern. Logga in ovan eller i terminalen och testa igen.",
    "このエージェントはサーバーで未ログインです。上のログイン操作またはターミナルでログインし、再テストしてください。"
  ],
  "没有走完": [
    "沒有走完",
    "Incomplete",
    "Ofullständigt",
    "未完了"
  ],
  "装好了": [
    "裝好了",
    "Installed",
    "Installerat",
    "インストール完了"
  ],
  "更新好了": [
    "更新好了",
    "Updated",
    "Uppdaterat",
    "更新完了"
  ],
  "{0} 在后台接着{1}，做完了会提示你": [
    "{0} 在後臺接著{1}，做完了會提示你",
    "{0} continues {1} in the background. You'll be notified when it's done.",
    "{0} fortsätter {1} i bakgrunden. Du får ett meddelande när det är klart.",
    "{0} はバックグラウンドで{1}を続けます。完了時に通知します"
  ],
  "… 输出显示在上面；要回答问题，点一下终端直接打字。关掉窗口也会在后台接着": [
    "… 輸出顯示在上面；要回答問題，點一下終端直接打字。關掉視窗也會在後臺接著",
    "… Output is shown above. Click the terminal to answer prompts. Closing this window continues the operation in the background.",
    "… Utdata visas ovan. Klicka i terminalen för att svara. Åtgärden fortsätter i bakgrunden när fönstret stängs.",
    "… 出力は上に表示されます。質問にはターミナルをクリックして回答してください。ウィンドウを閉じてもバックグラウンドで続行します"
  ],
  "，做完了会提示你。": [
    "，做完了會提示你。",
    "; you'll be notified when it's done.",
    "; du meddelas när det är klart.",
    "。完了時に通知します。"
  ],
  "，正在测试连接…": [
    "，正在測試連線…",
    "; testing connection…",
    "; testar anslutning…",
    "、接続をテスト中…"
  ],
  "，测试连接也通过了，可以用了。": [
    "，測試連線也通過了，可以用了。",
    "; connection test passed. Ready to use.",
    "; anslutningstestet godkänt. Redo att användas.",
    "、接続テストにも成功しました。利用できます。"
  ],
  "。还要登录才能用。": [
    "。還要登入才能用。",
    ". Sign in to use it.",
    ". Logga in för att använda.",
    "。利用するにはログインしてください。"
  ],
  "去登录": [
    "去登入",
    "Sign in now",
    "Logga in nu",
    "ログインする"
  ],
  "，但测试连接没通过：": [
    "，但測試連線沒通過：",
    ", but connection test failed:",
    ", men anslutningstestet misslyckades:",
    "、接続テストは失敗しました："
  ],
  "已中断。": [
    "已中斷。",
    "Interrupted.",
    "Avbruten.",
    "中断しました。"
  ],
  "{0}没成功：{1}{2}": [
    "{0}沒成功：{1}{2}",
    "{0} failed: {1}{2}",
    "{0} misslyckades: {1}{2}",
    "{0}に失敗しました：{1}{2}"
  ],
  "。看上面的输出找原因": [
    "。看上面的輸出找原因",
    ". Check the output above for details",
    ". Se utdata ovan för detaljer",
    "。詳しくは上の出力を確認してください"
  ],
  "再试一次": [
    "再試一次",
    "Try again",
    "Försök igen",
    "もう一度試す"
  ],
  "会在服务器上运行以下": [
    "會在伺服器上執行以下",
    "The following will run on the server",
    "Följande körs på servern",
    "サーバーで実行する"
  ],
  "命令：": [
    "命令：",
    "command:",
    "kommando:",
    "コマンド："
  ],
  "按终端上的提示操作。装好后自动测试连接；部分 Agent 还需要登录或配置模型供应商。": [
    "按終端上的提示操作。裝好後自動測試連線；部分 Agent 還需要登入或配置模型供應商。",
    "Follow the terminal instructions. Connection is tested after installation; some agents also need sign-in or provider configuration.",
    "Följ terminalens anvisningar. Anslutningen testas efter installation; vissa agenter behöver inloggning eller leverantörskonfiguration.",
    "ターミナルの案内に従ってください。インストール後に接続を自動テストします。一部のエージェントはログインやプロバイダー設定も必要です。"
  ],
  "开着的会话不受影响，新开的会话才用新版本。": [
    "開著的會話不受影響，新開的會話才用新版本。",
    "Open conversations are unaffected. Only new conversations use the new version.",
    "Öppna samtal påverkas inte. Bara nya samtal använder den nya versionen.",
    "開いている会話には影響しません。新しい会話から新バージョンを使用します。"
  ],
  "关掉窗口不会停，会在后台接着做。": [
    "關掉視窗不會停，會在後臺接著做。",
    "Closing the window keeps the operation running in the background.",
    "Åtgärden fortsätter i bakgrunden när fönstret stängs.",
    "ウィンドウを閉じてもバックグラウンドで続行します。"
  ],
  "，一次只做一件，等它做完再开始。": [
    "，一次只做一件，等它做完再開始。",
    "; one operation at a time. Wait for it to finish.",
    "; en åtgärd i taget. Vänta tills den är klar.",
    "。一度に実行できるのは1件です。完了までお待ちください。"
  ],
  "开始": [
    "開始",
    "Start",
    "Starta",
    "開始"
  ],
  "正在打开…": [
    "正在開啟…",
    "Opening…",
    "Öppnar…",
    "開いています…"
  ],
  "中断": [
    "中斷",
    "Interrupt",
    "Avbryt körning",
    "中断"
  ],
  "在后台继续": [
    "在後臺繼續",
    "Continue in background",
    "Fortsätt i bakgrunden",
    "バックグラウンドで続行"
  ],
  "微信登录": [
    "微信登入",
    "WeChat sign-in",
    "Logga in med WeChat",
    "WeChat でログイン"
  ],
  "Google / GitHub 登录": [
    "Google / GitHub 登入",
    "Google / GitHub sign-in",
    "Logga in med Google / GitHub",
    "Google / GitHub でログイン"
  ],
  "iOA 登录": [
    "iOA 登入",
    "iOA sign-in",
    "Logga in med iOA",
    "iOA でログイン"
  ],
  "企业域名登录": [
    "企業域名登入",
    "Enterprise domain sign-in",
    "Logga in med företagsdomän",
    "企業ドメインでログイン"
  ],
  "填{0} API Key，由 {1} 自己保存。": [
    "填{0} API Key，由 {1} 自己儲存。",
    "Enter {0} API key. {1} stores it in its own configuration.",
    "Ange {0} API-nyckel. {1} sparar den i sin egen konfiguration.",
    "{0} API キーを入力してください。{1} 自身の設定に保存します。"
  ],
  "{0} 的": [
    "{0} 的",
    "{0}'s",
    "för {0}",
    "{0} の"
  ],
  "一个": [
    "一個",
    "an",
    "en",
    "任意の"
  ],
  "验证码登录": [
    "驗證碼登入",
    "Device code sign-in",
    "Logga in med enhetskod",
    "認証コードでログイン"
  ],
  "给你一个网址和一串验证码，在手机或电脑上打开网址、输入验证码就登录好了。用会员账号登录选这个。": [
    "給你一個網址和一串驗證碼，在手機或電腦上開啟網址、輸入驗證碼就登入好了。用會員賬號登入選這個。",
    "Open the URL on your phone or computer and enter the code. Choose this for a subscription account.",
    "Öppna adressen på mobilen eller datorn och ange koden. Välj detta för ett abonnemangskonto.",
    "スマートフォンやパソコンで URL を開き、認証コードを入力します。サブスクリプションのアカウントはこちらを選択してください。"
  ],
  "设置向导": [
    "設定嚮導",
    "Setup wizard",
    "Konfigurationsguide",
    "設定ウィザード"
  ],
  "打开 {0} 自己的设置界面，在里面选模型供应商、填 Key 或登录账号，用键盘操作。": [
    "開啟 {0} 自己的設定介面，在裡面選模型供應商、填 Key 或登入賬號，用鍵盤操作。",
    "Open {0}'s setup interface to choose a provider, enter a key or sign in. Use the keyboard.",
    "Öppna {0}s inställningar för att välja leverantör, ange nyckel eller logga in. Använd tangentbordet.",
    "{0} の設定画面を開き、プロバイダー選択、キー入力、ログインを行います。キーボードで操作してください。"
  ],
  "{0} 会给一个登录网址，在手机或电脑上打开，按页面提示登录（比如微信扫码）。{1}": [
    "{0} 會給一個登入網址，在手機或電腦上開啟，按頁面提示登入（比如微信掃碼）。{1}",
    "{0} provides a sign-in URL. Open it on your phone or computer and follow the instructions. {1}",
    "{0} ger en inloggningsadress. Öppna den på mobilen eller datorn och följ anvisningarna. {1}",
    "{0} がログイン URL を表示します。スマートフォンやパソコンで開き、案内に従ってください。{1}"
  ],
  "向导退出了，正在测试连接，看看登录好了没有…": [
    "嚮導退出了，正在測試連線，看看登入好了沒有…",
    "Wizard exited. Testing whether sign-in succeeded…",
    "Guiden avslutades. Testar om inloggningen lyckades…",
    "ウィザードが終了しました。ログイン状態をテスト中…"
  ],
  "登录好了，正在测试连接…": [
    "登入好了，正在測試連線…",
    "Signed in. Testing connection…",
    "Inloggad. Testar anslutning…",
    "ログイン完了。接続をテスト中…"
  ],
  "✓ 登录好了，测试连接也通过了。": [
    "✓ 登入好了，測試連線也通過了。",
    "✓ Signed in and connection test passed.",
    "✓ Inloggad och anslutningstestet godkänt.",
    "✓ ログインと接続テストに成功しました。"
  ],
  "向导退出了，测试连接还是没通过": [
    "嚮導退出了，測試連線還是沒通過",
    "Wizard exited, but connection test still fails",
    "Guiden avslutades, men anslutningstestet misslyckas fortfarande",
    "ウィザードは終了しましたが、接続テストは失敗しました"
  ],
  "登录这一步做完了，但测试连接还没通过": [
    "登入這一步做完了，但測試連線還沒通過",
    "Sign-in finished, but connection test still fails",
    "Inloggningen är klar, men anslutningstestet misslyckas fortfarande",
    "ログイン操作は完了しましたが、接続テストは失敗しました"
  ],
  "换一种方式": [
    "換一種方式",
    "Choose another method",
    "Välj ett annat sätt",
    "別の方法を選ぶ"
  ],
  "向导想打开这个网址，服务器上没有浏览器，请在你的手机或电脑上打开：": [
    "嚮導想開啟這個網址，伺服器上沒有瀏覽器，請在你的手機或電腦上開啟：",
    "The wizard wants to open this URL. No browser is available on the server; open it on your phone or computer:",
    "Guiden vill öppna denna adress. Servern saknar webbläsare; öppna på mobilen eller datorn:",
    "ウィザードがこの URL を開こうとしています。サーバーにブラウザーがないため、スマートフォンやパソコンで開いてください："
  ],
  "已复制": [
    "已複製",
    "Copied",
    "Kopierat",
    "コピーしました"
  ],
  "复制网址": [
    "複製網址",
    "Copy URL",
    "Kopiera adress",
    "URL をコピー"
  ],
  "用键盘操作：方向键选择，回车确认。向导走完会自己退出，这里会显示结果。": [
    "用鍵盤操作：方向鍵選擇，回車確認。嚮導走完會自己退出，這裡會顯示結果。",
    "Use arrow keys to select and Enter to confirm. The wizard exits automatically and shows the result here.",
    "Välj med piltangenter och bekräfta med Enter. Guiden avslutas automatiskt och resultatet visas här.",
    "矢印キーで選択し、Enter で決定してください。完了後にウィザードが終了し、結果が表示されます。"
  ],
  "打开设置向导": [
    "開啟設定嚮導",
    "Open setup wizard",
    "Öppna konfigurationsguiden",
    "設定ウィザードを開く"
  ],
  "1. 在手机或电脑上打开": [
    "1. 在手機或電腦上開啟",
    "1. Open on your phone or computer",
    "1. Öppna på mobilen eller datorn",
    "1. スマートフォンやパソコンで開く"
  ],
  "2. 登录后输入验证码": [
    "2. 登入後輸入驗證碼",
    "2. Sign in and enter the code",
    "2. Logga in och ange koden",
    "2. ログインして認証コードを入力"
  ],
  "复制验证码": [
    "複製驗證碼",
    "Copy code",
    "Kopiera kod",
    "認証コードをコピー"
  ],
  "登录完成后这里会自动更新。验证码一般 15 分钟内有效。": [
    "登入完成後這裡會自動更新。驗證碼一般 15 分鐘內有效。",
    "This view updates after sign-in. Codes usually expire after 15 minutes.",
    "Vyn uppdateras efter inloggning. Koder går oftast ut efter 15 minuter.",
    "ログイン後に自動更新されます。コードの有効期限は通常15分です。"
  ],
  "网址几分钟内有效；过期了就取消，再登录一次。": [
    "網址幾分鐘內有效；過期了就取消，再登入一次。",
    "The URL expires in a few minutes. Cancel and sign in again if it expires.",
    "Adressen går ut efter några minuter. Avbryt och logga in igen om den går ut.",
    "URL は数分で期限切れになります。その場合はキャンセルして再度ログインしてください。"
  ],
  "正在要验证码…": [
    "正在要驗證碼…",
    "Requesting code…",
    "Hämtar kod…",
    "認証コードを取得中…"
  ],
  "正在等 {0} 给出登录网址…": [
    "正在等 {0} 給出登入網址…",
    "Waiting for {0}'s sign-in URL…",
    "Väntar på inloggningsadress från {0}…",
    "{0} のログイン URL を待機中…"
  ],
  "正在登录…": [
    "正在登入…",
    "Signing in…",
    "Loggar in…",
    "ログイン中…"
  ],
  "粘贴 API Key": [
    "貼上 API Key",
    "Paste API key",
    "Klistra in API-nyckel",
    "API キーを貼り付け"
  ],
  "获取验证码": [
    "獲取驗證碼",
    "Get code",
    "Hämta kod",
    "認証コードを取得"
  ],
  "开始登录": [
    "開始登入",
    "Start sign-in",
    "Starta inloggning",
    "ログインを開始"
  ],
  "登录 {0}": [
    "登入 {0}",
    "Sign in to {0}",
    "Logga in på {0}",
    "{0} にログイン"
  ],
  "‹ 换一种方式": [
    "‹ 換一種方式",
    "‹ Choose another method",
    "‹ Välj ett annat sätt",
    "‹ 別の方法を選ぶ"
  ],
  "选一种 {0} 自己提供的登录方式。登录信息存在服务器上 {1} 自己的配置里。": [
    "選一種 {0} 自己提供的登入方式。登入資訊存在伺服器上 {1} 自己的配置裡。",
    "Choose a sign-in method offered by {0}. Credentials are stored in {1}'s own configuration on the server.",
    "Välj ett inloggningssätt från {0}. Uppgifterna sparas i {1}s egen konfiguration på servern.",
    "{0} のログイン方法を選択してください。認証情報はサーバー上の {1} 自身の設定に保存されます。"
  ],
  "编程套餐 / Coding Plan Key": [
    "程式設計套餐 / Coding Plan Key",
    "Coding Plan key",
    "Coding Plan-nyckel",
    "Coding Plan キー"
  ],
  "按 API 用量计费": [
    "按 API 用量計費",
    "API usage billing",
    "API-användningsbaserad debitering",
    "API 従量課金"
  ],
  "原生账号登录": [
    "原生賬號登入",
    "Native account sign-in",
    "Agentens kontoinloggning",
    "エージェントのアカウントでログイン"
  ],
  "其他登录方式": [
    "其他登入方式",
    "Other sign-in methods",
    "Andra inloggningssätt",
    "その他のログイン方法"
  ],
  "模型接入": [
    "模型接入",
    "Model access",
    "Modellanslutning",
    "モデル接続"
  ],
  "使用 Agent 自己的配置和账号登录。测试连接后，可以查看它提供的登录方式。": [
    "使用 Agent 自己的配置和賬號登入。測試連線後，可以檢視它提供的登入方式。",
    "Use the agent's own configuration and sign-in. Test the connection to see available sign-in methods.",
    "Använd agentens egna inställningar och inloggning. Testa anslutningen för att se inloggningssätt.",
    "エージェント自身の設定とログインを利用します。接続テスト後にログイン方法を確認できます。"
  ],
  "也可以使用 Agent 原有配置或原生账号登录。订阅账号凭据由 Agent 自己保管。": [
    "也可以使用 Agent 原有配置或原生賬號登入。訂閱賬號憑據由 Agent 自己保管。",
    "You can also use the agent's own configuration or account sign-in. It manages subscription credentials itself.",
    "Du kan också använda agentens egen konfiguration eller inloggning. Agenten hanterar abonnemangsuppgifterna.",
    "エージェント本来の設定やアカウントログインも使えます。サブスクリプションの認証情報はエージェント自身が管理します。"
  ],
  "配置文档 ↗": [
    "配置文件 ↗",
    "Configuration docs ↗",
    "Konfigurationsdokumentation ↗",
    "設定ドキュメント ↗"
  ],
  "要改用原生订阅账号，先点“使用 Agent 原有配置”，再登录账号。": [
    "要改用原生訂閱賬號，先點“使用 Agent 原有配置”，再登入賬號。",
    "To use a subscription account, first select Use agent configuration, then sign in.",
    "För abonnemangskonto, välj först Använd agentens konfiguration och logga sedan in.",
    "サブスクリプションのアカウントを使うには、まず「エージェント本来の設定を使用」を押してからログインしてください。"
  ],
  "先安装": [
    "先安裝",
    "Install first",
    "Installera först",
    "先にインストール"
  ],
  "，再打开原生登录或配置向导。": [
    "，再開啟原生登入或配置嚮導。",
    ", then open native sign-in or the setup wizard.",
    ", öppna sedan agentens inloggning eller konfigurationsguide.",
    "してから、ログインまたは設定ウィザードを開いてください。"
  ],
  "兼容接口配置可以先保存。": [
    "相容介面配置可以先儲存。",
    "Compatible API configuration can be saved now.",
    "Kompatibel API-konfiguration kan sparas nu.",
    "互換 API 設定は先に保存できます。"
  ],
  "测试连接后，才能查看当前 Agent 提供的账号登录方式。": [
    "測試連線後，才能檢視當前 Agent 提供的賬號登入方式。",
    "Test the connection first to see account sign-in methods.",
    "Testa anslutningen först för att se kontoinloggningssätt.",
    "アカウントのログイン方法を確認するには、最初に接続をテストしてください。"
  ],
  "原生向导可以直接打开。": [
    "原生嚮導可以直接開啟。",
    "The native wizard can be opened directly.",
    "Agentens guide kan öppnas direkt.",
    "設定ウィザードは直接開けます。"
  ],
  "也可以按配置文档使用 Agent 自己的设置。": [
    "也可以按配置文件使用 Agent 自己的設定。",
    "You can also configure the agent using its documentation.",
    "Du kan också konfigurera agenten enligt dokumentationen.",
    "ドキュメントに沿ってエージェント自身の設定を使用することもできます。"
  ],
  "账号授权和凭据由": [
    "賬號授權和憑據由",
    "Authorization and credentials are managed by",
    "Behörighet och inloggningsuppgifter hanteras av",
    "認証と認証情報の管理元："
  ],
  "自己管理。打开窗口后，点开始才会运行登录或设置向导。": [
    "自己管理。開啟視窗後，點開始才會執行登入或設定嚮導。",
    ". The sign-in or setup wizard runs only when you click Start.",
    ". Inloggnings- eller konfigurationsguiden körs först när du klickar på Starta.",
    "。ウィザードは「開始」を押すと実行されます。"
  ],
  "没能保存，请检查配置后重试。": [
    "沒能儲存，請檢查配置後重試。",
    "Could not save. Check configuration and retry.",
    "Kunde inte spara. Kontrollera konfigurationen och försök igen.",
    "保存できませんでした。設定を確認して再試行してください。"
  ],
  "填写供应商的接口地址。": [
    "填寫供應商的介面地址。",
    "Enter the provider's API base URL.",
    "Ange leverantörens API-adress.",
    "プロバイダーの API URL を入力してください。"
  ],
  "填写模型名。": [
    "填寫模型名。",
    "Enter a model name.",
    "Ange ett modellnamn.",
    "モデル名を入力してください。"
  ],
  "填写 API Key；更换接口地址、协议或套餐后需要重新提供 Key。": [
    "填寫 API Key；更換介面地址、協議或套餐後需要重新提供 Key。",
    "Enter an API key. A new key is required when changing the URL, protocol or plan.",
    "Ange en API-nyckel. En ny nyckel behövs när adress, protokoll eller plan ändras.",
    "API キーを入力してください。URL、プロトコル、プランを変えた場合は再入力が必要です。"
  ],
  "上下文长度要填 1024 到 10000000 之间的整数，或留空使用默认。": [
    "上下文長度要填 1024 到 10000000 之間的整數，或留空使用預設。",
    "Context must be an integer from 1024 to 10000000, or empty for the default.",
    "Kontext måste vara ett heltal mellan 1024 och 10000000, eller tomt för standardvärdet.",
    "コンテキスト長は1024～10000000の整数を入力してください。空欄なら既定値を使用します。"
  ],
  "{0} 的模型接入配置已保存": [
    "{0} 的模型接入配置已儲存",
    "Saved model configuration for {0}",
    "Sparade modellkonfigurationen för {0}",
    "{0} のモデル接続設定を保存しました"
  ],
  "已保存。安装 Agent 后测试连接，新开的会话会使用此配置。": [
    "已儲存。安裝 Agent 後測試連線，新開的會話會使用此配置。",
    "Saved. Test after installing the agent. New conversations will use this configuration.",
    "Sparat. Testa efter installation av agenten. Nya samtal använder konfigurationen.",
    "保存しました。インストール後に接続をテストしてください。新しい会話から適用されます。"
  ],
  "已保存。新开的会话会使用此配置。": [
    "已儲存。新開的會話會使用此配置。",
    "Saved. New conversations will use this configuration.",
    "Sparat. Nya samtal använder konfigurationen.",
    "保存しました。新しい会話から適用されます。"
  ],
  "{0} 已使用原有模型配置": [
    "{0} 已使用原有模型配置",
    "{0} now uses its own model configuration",
    "{0} använder nu sin egen modellkonfiguration",
    "{0} を本来のモデル設定に戻しました"
  ],
  "已恢复使用 Agent 原有配置，新开的会话会生效。": [
    "已恢復使用 Agent 原有配置，新開的會話會生效。",
    "Restored agent configuration. Applies to new conversations.",
    "Agentens konfiguration återställd. Gäller nya samtal.",
    "エージェント本来の設定に戻しました。新しい会話から適用されます。"
  ],
  "使用 Agent 原有配置": [
    "使用 Agent 原有配置",
    "Use agent configuration",
    "Använd agentens konfiguration",
    "エージェント本来の設定を使用"
  ],
  "修改模型配置": [
    "修改模型配置",
    "Edit model configuration",
    "Ändra modellkonfiguration",
    "モデル設定を変更"
  ],
  "配置兼容接口": [
    "配置相容介面",
    "Configure compatible API",
    "Konfigurera kompatibelt API",
    "互換 API を設定"
  ],
  "正在恢复…": [
    "正在恢復…",
    "Restoring…",
    "Återställer…",
    "復元中…"
  ],
  "· Key 末尾 {0}": [
    "· Key 末尾 {0}",
    "· Key ending {0}",
    "· Nyckeln slutar på {0}",
    "· キー末尾 {0}"
  ],
  "{0} 模型配置": [
    "{0} 模型配置",
    "{0} model configuration",
    "Modellkonfiguration för {0}",
    "{0} のモデル設定"
  ],
  "接口类型": [
    "介面型別",
    "API protocol",
    "API-protokoll",
    "API の種類"
  ],
  "计费方式": [
    "計費方式",
    "Billing",
    "Debitering",
    "課金方式"
  ],
  "API 用量计费": [
    "API 用量計費",
    "API usage billing",
    "API-användningsbaserad debitering",
    "API 従量課金"
  ],
  "供应商搜索": [
    "供應商搜尋",
    "Search providers",
    "Sök leverantörer",
    "プロバイダーを検索"
  ],
  "搜索名称、地址或模型": [
    "搜尋名稱、地址或模型",
    "Search names, URLs or models",
    "Sök namn, adresser eller modeller",
    "名前・URL・モデルで検索"
  ],
  "供应商": [
    "供應商",
    "Provider",
    "Leverantör",
    "プロバイダー"
  ],
  "填写自己的接口地址与模型": [
    "填寫自己的介面地址與模型",
    "Enter your own API URL and model",
    "Ange egen API-adress och modell",
    "独自の API URL とモデルを入力"
  ],
  "当前协议和计费方式下找到 {0} 个供应商预设。": [
    "當前協議和計費方式下找到 {0} 個供應商預設。",
    "Provider presets for this protocol and billing: {0}.",
    "Leverantörsprofiler för detta protokoll och denna debitering: {0}.",
    "このプロトコルと課金方式に対応するプリセットは {0} 件です。"
  ],
  "没有匹配的供应商，试试其他名称，或选择“其他兼容接口”填写地址。": [
    "沒有匹配的供應商，試試其他名稱，或選擇“其他相容介面”填寫地址。",
    "No matching providers. Try another name or choose Other compatible API.",
    "Inga matchande leverantörer. Prova ett annat namn eller välj Annat kompatibelt API.",
    "一致するプロバイダーがありません。別の名前を検索するか「その他の互換 API」を選んでください。"
  ],
  "预设备用地址": [
    "預設備用地址",
    "Preset backup URL",
    "Förinställd reservadress",
    "予備 URL プリセット"
  ],
  "手动填写接口地址": [
    "手動填寫介面地址",
    "Enter URL manually",
    "Ange adress manuellt",
    "URL を手動入力"
  ],
  "接口地址": [
    "API 位址",
    "API base URL",
    "API-adress",
    "API URL"
  ],
  "已保存{0}；不换就留空": [
    "已儲存{0}；不換就留空",
    "Saved{0}; leave empty to keep it",
    "Sparad{0}; lämna tomt för att behålla",
    "保存済み{0}。変更しない場合は空欄"
  ],
  "，末尾 {0}": [
    "，末尾 {0}",
    ", ending {0}",
    ", slutar på {0}",
    "、末尾 {0}"
  ],
  "粘贴这个接口的 Key": [
    "貼上這個介面的 Key",
    "Paste the key for this API",
    "Klistra in nyckeln för detta API",
    "この API のキーを貼り付け"
  ],
  "留空保留这个接口已保存的 Key。": [
    "留空保留這個介面已儲存的 Key。",
    "Leave empty to keep the saved key for this API.",
    "Lämna tomt för att behålla den sparade API-nyckeln.",
    "空欄の場合、この API の保存済みキーを使用します。"
  ],
  "接口地址、协议或套餐已变更，需要重新提供 Key。": [
    "介面地址、協議或套餐已變更，需要重新提供 Key。",
    "URL, protocol or plan changed. Enter a key again.",
    "Adress, protokoll eller plan har ändrats. Ange nyckeln igen.",
    "URL、プロトコル、プランが変わったため、キーを再入力してください。"
  ],
  "这里保存 API 或编程套餐 Key；订阅账号授权请使用原生账号登录。": [
    "這裡儲存 API 或程式設計套餐 Key；訂閱賬號授權請使用原生賬號登入。",
    "Save API or Coding Plan keys here. Use native sign-in for subscription account authorization.",
    "Spara API- eller Coding Plan-nycklar här. Använd agentens inloggning för abonnemangskonton.",
    "API または Coding Plan のキーを保存します。サブスクリプションのアカウント認証にはエージェントのログインを使用してください。"
  ],
  "模型": [
    "模型",
    "Model",
    "Modell",
    "モデル"
  ],
  "供应商文档中的模型 ID": [
    "供應商文件中的模型 ID",
    "Model ID from the provider's docs",
    "Modell-ID från leverantörens dokumentation",
    "プロバイダーのドキュメントにあるモデル ID"
  ],
  "留空使用默认": [
    "留空使用預設",
    "Leave empty for default",
    "Tomt för standardvärde",
    "空欄で既定値を使用"
  ],
  "由 Agent 管理": [
    "由 Agent 管理",
    "Managed by agent",
    "Hanteras av agenten",
    "エージェントが管理"
  ],
  "按所选模型填写上下文 token 数；留空使用预设或 Agent 默认，切换模型时以供应商文档为准。": [
    "按所選模型填寫上下文 token 數；留空使用預設或 Agent 預設，切換模型時以供應商文件為準。",
    "Enter the model's context length in tokens. Leave empty for the preset or agent default; check provider docs when switching models.",
    "Ange modellens kontextlängd i token. Lämna tomt för profilens eller agentens standard; kontrollera dokumentationen vid modellbyte.",
    "モデルのコンテキスト長をトークン数で入力します。空欄ならプリセットまたは既定値を使用します。モデル変更時はプロバイダーのドキュメントを確認してください。"
  ],
  "此 Agent 使用自身的上下文设置。": [
    "此 Agent 使用自身的上下文設定。",
    "This agent uses its own context settings.",
    "Agenten använder egna kontextinställningar.",
    "このエージェントは自身のコンテキスト設定を使用します。"
  ],
  "供应商文档 ↗": [
    "供應商文件 ↗",
    "Provider docs ↗",
    "Leverantörens dokumentation ↗",
    "プロバイダーのドキュメント ↗"
  ],
  "供应商网站 ↗": [
    "供應商網站 ↗",
    "Provider website ↗",
    "Leverantörens webbplats ↗",
    "プロバイダーのサイト ↗"
  ],
  "检查接口": [
    "檢查介面",
    "Check API",
    "Kontrollera API",
    "API を確認"
  ],
  "正在保存…": [
    "正在儲存…",
    "Saving…",
    "Sparar…",
    "保存中…"
  ],
  "保存配置": [
    "儲存配置",
    "Save configuration",
    "Spara konfiguration",
    "設定を保存"
  ],
  "接口检查读取模型列表并提交空体协议校验，不发送对话内容；实际模型权限和订阅额度需进一步确认。列出的模型仅作参考，不代表当前 Key 都有权限。Key 只保存在服务器上，保存后新开的会话才生效。": [
    "介面檢查讀取模型列表並提交空體協議校驗，不傳送對話內容；實際模型許可權和訂閱額度需進一步確認。列出的模型僅作參考，不代表當前 Key 都有許可權。Key 只儲存在伺服器上，儲存後新開的會話才生效。",
    "The check reads the model list and validates the protocol with an empty request; no conversation is sent. Model access and subscription quota need further verification. Listed models do not guarantee key access. Keys stay on the server; saved configuration applies to new conversations.",
    "Kontrollen läser modellistan och validerar protokollet med en tom begäran; inget samtal skickas. Modellåtkomst och abonnemangskvot behöver verifieras vidare. Listade modeller garanterar inte nyckelåtkomst. Nycklar lagras på servern; sparade inställningar gäller nya samtal.",
    "モデル一覧の取得と空のリクエストによるプロトコル確認を行い、会話内容は送信しません。モデル権限や使用枠は別途確認が必要です。一覧はキーの利用権限を保証しません。キーはサーバーにのみ保存され、新しい会話から設定が適用されます。"
  ],
  "已退出 {0}": [
    "已退出 {0}",
    "Signed out {0}",
    "Loggade ut {0}",
    "{0} をログアウトしました"
  ],
  "退出其他所有设备？它们都要重新输入密码才能登录。": [
    "退出其他所有裝置？它們都要重新輸入密碼才能登入。",
    "Sign out all other devices? They will need to enter the password again.",
    "Logga ut alla andra enheter? De måste ange lösenordet igen.",
    "ほかのすべてのデバイスをログアウトしますか？再度パスワードが必要になります。"
  ],
  "已退出其他 {0} 台设备": [
    "已退出其他 {0} 臺裝置",
    "Signed out {0} other devices",
    "Loggade ut {0} andra enheter",
    "ほかの {0} 台をログアウトしました"
  ],
  "没有其他设备": [
    "沒有其他裝置",
    "No other devices",
    "Inga andra enheter",
    "ほかのデバイスはありません"
  ],
  "安全": [
    "安全",
    "Security",
    "Säkerhet",
    "セキュリティ"
  ],
  "修改密码": [
    "修改密碼",
    "Change password",
    "Ändra lösenord",
    "パスワードを変更"
  ],
  "登录设备": [
    "登入裝置",
    "Signed-in devices",
    "Inloggade enheter",
    "ログイン中のデバイス"
  ],
  "设备": [
    "裝置",
    "Device",
    "Enhet",
    "デバイス"
  ],
  "最近活动": [
    "最近活動",
    "Last active",
    "Senast aktiv",
    "最終アクセス"
  ],
  "这台设备": [
    "這臺裝置",
    "This device",
    "Denna enhet",
    "このデバイス"
  ],
  "不保持登录": [
    "不保持登入",
    "Temporary login",
    "Tillfällig inloggning",
    "ログインを維持しない"
  ],
  "现在": [
    "現在",
    "Now",
    "Nu",
    "現在"
  ],
  "退出": [
    "退出",
    "Sign out",
    "Logga ut",
    "ログアウト"
  ],
  "退出其他所有设备": [
    "退出其他所有裝置",
    "Sign out all other devices",
    "Logga ut alla andra enheter",
    "ほかのすべてのデバイスをログアウト"
  ],
  "审计日志": [
    "審計日誌",
    "Audit log",
    "Granskningslogg",
    "監査ログ"
  ],
  "时间": [
    "時間",
    "Time",
    "Tid",
    "時刻"
  ],
  "事件": [
    "事件",
    "Event",
    "Händelse",
    "イベント"
  ],
  "查看更早的": [
    "檢視更早的",
    "Load older entries",
    "Visa äldre poster",
    "以前の記録を表示"
  ],
  "先输入当前密码。": [
    "先輸入當前密碼。",
    "Enter the current password first.",
    "Ange aktuellt lösenord först.",
    "現在のパスワードを入力してください。"
  ],
  "新密码至少要 {0} 位。": [
    "新密碼至少要 {0} 位。",
    "New password needs at least {0} characters.",
    "Nytt lösenord måste ha minst {0} tecken.",
    "新しいパスワードは {0} 文字以上にしてください。"
  ],
  "两次输入的新密码不一样。": [
    "兩次輸入的新密碼不一樣。",
    "The new passwords don't match.",
    "De nya lösenorden stämmer inte överens.",
    "新しいパスワードが一致しません。"
  ],
  "密码已修改，其他 {0} 台设备已退出登录": [
    "密碼已修改，其他 {0} 臺裝置已退出登入",
    "Password changed. Signed out {0} other devices.",
    "Lösenordet ändrat. Loggade ut {0} andra enheter.",
    "パスワードを変更し、ほかの {0} 台をログアウトしました"
  ],
  "密码已修改": [
    "密碼已修改",
    "Password changed",
    "Lösenordet ändrat",
    "パスワードを変更しました"
  ],
  "当前密码不对。再输错 {0} 次，这个 IP 会被锁定 15 分钟。": [
    "當前密碼不對。再輸錯 {0} 次，這個 IP 會被鎖定 15 分鐘。",
    "Incorrect current password. After {0} more failures, this IP will be locked for 15 minutes.",
    "Fel aktuellt lösenord. Efter ytterligare {0} fel spärras denna IP i 15 minuter.",
    "現在のパスワードが違います。あと {0} 回間違えると、この IP は15分間ロックされます。"
  ],
  "尝试次数太多，已暂时锁定，{0} 分钟后再试。": [
    "嘗試次數太多，已暫時鎖定，{0} 分鐘後再試。",
    "Too many attempts. Temporarily locked. Try again in {0} minutes.",
    "För många försök. Tillfälligt spärrad. Försök igen om {0} minuter.",
    "試行回数が多すぎます。{0} 分後に再度お試しください。"
  ],
  "当前密码": [
    "當前密碼",
    "Current password",
    "Aktuellt lösenord",
    "現在のパスワード"
  ],
  "新密码，至少 {0} 位": [
    "新密碼，至少 {0} 位",
    "New password, at least {0} characters",
    "Nytt lösenord, minst {0} tecken",
    "新しいパスワード、{0} 文字以上"
  ],
  "再输一次新密码": [
    "再輸一次新密碼",
    "Repeat new password",
    "Upprepa nytt lösenord",
    "新しいパスワードを再入力"
  ],
  "改好后其他设备都要重新登录，这台设备保持登录。": [
    "改好後其他裝置都要重新登入，這臺裝置保持登入。",
    "Other devices must sign in again. This device stays signed in.",
    "Andra enheter måste logga in igen. Denna enhet förblir inloggad.",
    "変更後はほかのデバイスで再ログインが必要です。このデバイスのログインは維持されます。"
  ],
  "设置了登录密码": [
    "設定了登入密碼",
    "Set login password",
    "Angav inloggningslösenord",
    "ログインパスワードを設定"
  ],
  "登录成功（不保持登录）": [
    "登入成功（不保持登入）",
    "Signed in (temporary)",
    "Loggade in (tillfälligt)",
    "ログイン成功（維持しない）"
  ],
  "登录成功": [
    "登入成功",
    "Signed in successfully",
    "Loggade in",
    "ログイン成功"
  ],
  "密码错误": [
    "密碼錯誤",
    "Incorrect password",
    "Fel lösenord",
    "パスワードエラー"
  ],
  "设置链接不对": [
    "設定連結不對",
    "Invalid setup link",
    "Ogiltig installationslänk",
    "設定リンクが無効"
  ],
  "修改密码时当前密码输错": [
    "修改密碼時當前密碼輸錯",
    "Incorrect current password during password change",
    "Fel aktuellt lösenord vid lösenordsbyte",
    "パスワード変更時に現在のパスワードを誤入力"
  ],
  "连续输错 5 次，这个 IP 已锁定 {0} 分钟": [
    "連續輸錯 5 次，這個 IP 已鎖定 {0} 分鐘",
    "5 consecutive failed attempts. IP locked for {0} minutes.",
    "5 felaktiga försök i rad. IP spärrad i {0} minuter.",
    "5回連続の誤入力により、IP を {0} 分間ロック"
  ],
  "退出登录": [
    "退出登入",
    "Signed out",
    "Loggade ut",
    "ログアウトしました"
  ],
  "退出了一台设备（{0}）": [
    "退出了一臺裝置（{0}）",
    "Signed out a device ({0})",
    "Loggade ut en enhet ({0})",
    "デバイスをログアウト（{0}）"
  ],
  "未知设备": [
    "未知裝置",
    "Unknown device",
    "Okänd enhet",
    "不明なデバイス"
  ],
  "退出了其他 {0} 台设备": [
    "退出了其他 {0} 臺裝置",
    "Signed out {0} other devices",
    "Loggade ut {0} andra enheter",
    "ほかの {0} 台をログアウト"
  ],
  "修改了密码，其他 {0} 台设备已退出": [
    "修改了密碼，其他 {0} 臺裝置已退出",
    "Changed password and signed out {0} other devices",
    "Ändrade lösenord och loggade ut {0} andra enheter",
    "パスワードを変更し、ほかの {0} 台をログアウト"
  ],
  "修改了密码": [
    "修改了密碼",
    "Changed password",
    "Ändrade lösenord",
    "パスワードを変更"
  ],
  "在服务器上重置了密码": [
    "在伺服器上重置了密碼",
    "Reset password on server",
    "Återställde lösenord på servern",
    "サーバーでパスワードをリセット"
  ],
  "登录了 {0}{1}": [
    "登入了 {0}{1}",
    "Signed in to {0}{1}",
    "Loggade in på {0}{1}",
    "{0} にログイン{1}"
  ],
  "{0} 登录没成功{1}": [
    "{0} 登入沒成功{1}",
    "{0} sign-in failed{1}",
    "Inloggning på {0} misslyckades{1}",
    "{0} のログインに失敗{1}"
  ],
  "了": [
    "了",
    "completed",
    "klart",
    "完了"
  ],
  "时中断了": [
    "時中斷了",
    "interrupted",
    "avbröts",
    "中断"
  ],
  "没成功{0}": [
    "沒成功{0}",
    "failed{0}",
    "misslyckades{0}",
    "失敗{0}"
  ],
  "（退出码 {0}）": [
    "（退出碼 {0}）",
    "(exit code {0})",
    "(avslutningskod {0})",
    "（終了コード {0}）"
  ],
  "修改了 {0} 的设置{1}": [
    "修改了 {0} 的設定{1}",
    "Changed {0} settings{1}",
    "Ändrade inställningar för {0}{1}",
    "{0} の設定を変更{1}"
  ],
  "批准": [
    "批准",
    "Approve",
    "Godkänn",
    "承認"
  ],
  "本会话都批准": [
    "本會話都批准",
    "Approve for this conversation",
    "Godkänn för detta samtal",
    "この会話ではすべて承認"
  ],
  "默认权限模式": [
    "預設許可權模式",
    "Default permission mode",
    "Standardbehörighetsläge",
    "既定の権限モード"
  ],
  "默认审批档位": [
    "預設審批檔位",
    "Default approval level",
    "Standardnivå för godkännande",
    "既定の承認レベル"
  ],
  "默认模型": [
    "預設模型",
    "Default model",
    "Standardmodell",
    "既定のモデル"
  ],
  "模型供应商": [
    "模型供應商",
    "Model provider",
    "Modellleverantör",
    "モデルプロバイダー"
  ],
  "填 API Key": [
    "填 API Key",
    "Enter API key",
    "Ange API-nyckel",
    "API キーを入力"
  ],
  "关于": [
    "關於",
    "About",
    "Om",
    "このアプリについて"
  ],
  "设置分类": [
    "設定分類",
    "Settings categories",
    "Inställningskategorier",
    "設定カテゴリ"
  ],
  "数据目录": [
    "資料目錄",
    "Data directory",
    "Datakatalog",
    "データディレクトリ"
  ],
  "会话记录、登录信息和设置都存在这里，文件权限 600。": [
    "會話記錄、登入資訊和設定都存在這裡，檔案許可權 600。",
    "Conversations, login data and settings are stored here with file permissions 600.",
    "Samtal, inloggningsdata och inställningar sparas här med filbehörighet 600.",
    "会話履歴、ログイン情報、設定はここに保存されます。ファイル権限は600です。"
  ],
  "已运行": [
    "已執行",
    "Uptime",
    "Drifttid",
    "稼働時間"
  ],
  "运行环境": [
    "執行環境",
    "Runtime",
    "Körmiljö",
    "実行環境"
  ],
  "协议日志": [
    "協議日誌",
    "Protocol log",
    "Protokolllogg",
    "プロトコルログ"
  ],
  "下载，用于排查 Agent 问题": [
    "下載，用於排查 Agent 問題",
    "Download for agent troubleshooting",
    "Ladda ned för agentfelsökning",
    "エージェントの問題調査用にダウンロード"
  ],
  "包含开着的会话最近的通信记录，里面可能有对话内容，发给别人之前先看一眼。": [
    "包含開著的會話最近的通訊記錄，裡面可能有對話內容，發給別人之前先看一眼。",
    "Contains recent communication from open conversations and may include chat content. Review before sharing.",
    "Innehåller senaste kommunikationen från öppna samtal, eventuellt även chattinnehåll. Granska före delning.",
    "開いている会話の最近の通信記録が含まれます。会話内容が含まれる場合があるため、共有前に確認してください。"
  ],
  "已添加": [
    "已新增",
    "Added",
    "Tillagt",
    "追加しました"
  ],
  "项目文件夹": [
    "專案資料夾",
    "Project folders",
    "Projektmappar",
    "プロジェクトフォルダー"
  ],
  "个 Agent 已启动": [
    "個 Agent 已啟動",
    "agents started",
    "startade agenter",
    "個のエージェントが起動中"
  ],
  "默认工作区": [
    "預設工作區",
    "Default workspace",
    "Standardarbetsyta",
    "既定のワークスペース"
  ],
  "系统预设": [
    "系統預設",
    "System preset",
    "Systemförval",
    "システムのプリセット"
  ],
  "把 {0} 从工作区里拿掉？文件夹里的东西不会动。": [
    "把 {0} 從工作區裡拿掉？資料夾裡的東西不會動。",
    "Remove {0} from workspaces? Files in the folder will stay unchanged.",
    "Ta bort {0} från arbetsytorna? Filerna i mappen påverkas inte.",
    "{0} をワークスペースから外しますか？フォルダー内のファイルは変更されません。"
  ],
  "已移除 {0}": [
    "已移除 {0}",
    "Removed {0}",
    "Tog bort {0}",
    "{0} を削除しました"
  ],
  "移除": [
    "移除",
    "Remove",
    "Ta bort",
    "削除"
  ],
  "还没有工作区。": [
    "還沒有工作區。",
    "No workspaces yet.",
    "Inga arbetsytor ännu.",
    "ワークスペースがありません。"
  ],
  "每个工作区对应一个项目文件夹。移除只移除列表入口，文件和历史会话仍会保留；有 Agent 已启动时，需要先结束会话。": [
    "每個工作區對應一個專案資料夾。移除只移除列表入口，檔案和歷史會話仍會保留；有 Agent 已啟動時，需要先結束會話。",
    "Each workspace is a project folder. Removing it only removes the list entry; files and history remain. End running agent conversations before removal.",
    "Varje arbetsyta är en projektmapp. Borttagning tar bara bort listposten; filer och historik sparas. Avsluta aktiva agentsamtal först.",
    "各ワークスペースはプロジェクトフォルダーに対応します。削除してもファイルと会話履歴は保持されます。エージェントが起動中の場合は先に会話を終了してください。"
  ],
  "高级设置": [
    "進階設定",
    "Advanced settings",
    "Avancerade inställningar",
    "詳細設定"
  ],
  "目录范围与运行上限": [
    "目錄範圍與執行上限",
    "Directory scope and run limit",
    "Katalogområde och körgräns",
    "ディレクトリの範囲と実行上限"
  ],
  "可添加项目的目录": [
    "可新增專案的目錄",
    "Allowed project directories",
    "Tillåtna projektkataloger",
    "プロジェクト追加が可能なディレクトリ"
  ],
  "网页可以从以下目录及其子目录选择项目文件夹。": [
    "網頁可以從以下目錄及其子目錄選擇專案資料夾。",
    "Project folders can be selected from these directories and their subdirectories.",
    "Projektmappar får väljas från dessa kataloger och deras underkataloger.",
    "以下のディレクトリとその配下からプロジェクトフォルダーを選択できます。"
  ],
  "已移除": [
    "已移除",
    "Removed",
    "Borttaget",
    "削除しました"
  ],
  "还没有。先添加一个存放项目的目录。": [
    "還沒有。先新增一個存放專案的目錄。",
    "None yet. Add a directory for your projects.",
    "Inga ännu. Lägg till en katalog för dina projekt.",
    "未設定です。プロジェクト用のディレクトリを追加してください。"
  ],
  "添加允许的目录": [
    "新增允許的目錄",
    "Add allowed directory",
    "Lägg till tillåten katalog",
    "許可されたディレクトリを追加"
  ],
  "完整路径，比如 ~/projects": [
    "完整路徑，比如 ~/projects",
    "Full path, e.g. ~/projects",
    "Fullständig sökväg, t.ex. ~/projects",
    "完全パス（例：~/projects）"
  ],
  "添加目录": [
    "新增目錄",
    "Add directory",
    "Lägg till katalog",
    "ディレクトリを追加"
  ],
  "~ 表示服务器用户的主目录。想收窄选择范围，先添加存放项目的目录，再移除主目录。": [
    "~ 表示伺服器使用者的主目錄。想收窄選擇範圍，先新增存放專案的目錄，再移除主目錄。",
    "~ is the server user's home directory. To narrow the scope, add a project directory, then remove the home directory.",
    "~ är serveranvändarens hemkatalog. Begränsa området genom att lägga till en projektkatalog och sedan ta bort hemkatalogen.",
    "~ はサーバーユーザーのホームディレクトリです。範囲を狭めるにはプロジェクト用ディレクトリを追加し、ホームディレクトリを除外してください。"
  ],
  "同时运行上限": [
    "同時執行上限",
    "Concurrent agent limit",
    "Gräns för samtidiga agenter",
    "同時実行の上限"
  ],
  "减少运行上限": [
    "減少執行上限",
    "Decrease limit",
    "Minska gränsen",
    "上限を減らす"
  ],
  "上限改为 {0}": [
    "上限改為 {0}",
    "Limit changed to {0}",
    "Gränsen ändrad till {0}",
    "上限を {0} に変更しました"
  ],
  "增加运行上限": [
    "增加執行上限",
    "Increase limit",
    "Öka gränsen",
    "上限を増やす"
  ],
  "当前已启动": [
    "當前已啟動",
    "Currently running",
    "Aktiva nu",
    "現在起動中："
  ],
  "个 Agent，上限": [
    "個 Agent，上限",
    "agents; limit",
    "agenter; gräns",
    "個、上限："
  ],
  "个": [
    "個",
    "agents",
    "agenter",
    "個"
  ],
  "空闲和等待审批的 Agent 也占用名额。达到上限时，新启动前需要先结束一个会话。": [
    "空閒和等待審批的 Agent 也佔用名額。達到上限時，新啟動前需要先結束一個會話。",
    "Idle agents and those awaiting approval also count. At the limit, end a conversation before starting another.",
    "Inaktiva agenter och de som väntar på godkännande räknas också. Vid gränsen måste ett samtal avslutas innan ett nytt startas.",
    "待機中・承認待ちのエージェントも数に含まれます。上限に達した場合は会話を終了してから新しく起動してください。"
  ],
  "导出失败，请重试": [
    "匯出失敗，請重試",
    "Export failed. Please retry.",
    "Exporten misslyckades. Försök igen.",
    "エクスポートに失敗しました。再試行してください"
  ],
  "会话.md": [
    "會話.md",
    "conversation.md",
    "samtal.md",
    "会話.md"
  ],
  "今天": [
    "今天",
    "Today",
    "Idag",
    "今日"
  ],
  "明天": [
    "明天",
    "Tomorrow",
    "Imorgon",
    "明日"
  ],
  "{0}月{1}日": [
    "{0}月{1}日",
    "{0}/{1}",
    "{1}/{0}",
    "{0}月{1}日"
  ],
  "ChatGPT {0} 账号": [
    "ChatGPT {0} 賬號",
    "ChatGPT {0} account",
    "ChatGPT {0}-konto",
    "ChatGPT {0} アカウント"
  ],
  "{0}剩 {1}%{2}": [
    "{0}剩 {1}%{2}",
    "{0}: {1}% remaining{2}",
    "{0}: {1}% återstår{2}",
    "{0} 残り {1}%{2}"
  ],
  "，{0} 重置": [
    "，{0} 重置",
    ", resets {0}",
    ", återställs {0}",
    "、{0} にリセット"
  ],
  "{0} 分 {1} 秒": [
    "{0} 分 {1} 秒",
    "{0} min {1} sec",
    "{0} min {1} sek",
    "{0} 分 {1} 秒"
  ],
  "{0} 分钟": [
    "{0} 分鐘",
    "{0} min",
    "{0} min",
    "{0} 分"
  ],
  "{0} 小时 {1} 分": [
    "{0} 小時 {1} 分",
    "{0} hr {1} min",
    "{0} tim {1} min",
    "{0} 時間 {1} 分"
  ],
  "{0} 天 {1} 小时": [
    "{0} 天 {1} 小時",
    "{0} d {1} hr",
    "{0} d {1} tim",
    "{0} 日 {1} 時間"
  ],
  "{0} 时 {1} 分": [
    "{0} 時 {1} 分",
    "{0} hr {1} min",
    "{0} tim {1} min",
    "{0} 時間 {1} 分"
  ],
  "启动中": [
    "啟動中",
    "Starting",
    "Startar",
    "起動中"
  ],
  "已退出": [
    "已退出",
    "Exited",
    "Avslutad",
    "終了済み"
  ],
  "未运行": [
    "未執行",
    "Not running",
    "Körs inte",
    "未起動"
  ],
  "刚刚": [
    "剛剛",
    "Just now",
    "Just nu",
    "たった今"
  ],
  "{0} 分钟前": [
    "{0} 分鐘前",
    "{0} min ago",
    "för {0} min sedan",
    "{0} 分前"
  ],
  "今天 {0}": [
    "今天 {0}",
    "Today {0}",
    "Idag {0}",
    "今日 {0}"
  ],
  "昨天 {0}": [
    "昨天 {0}",
    "Yesterday {0}",
    "Igår {0}",
    "昨日 {0}"
  ],
  "{0} 天前": [
    "{0} 天前",
    "{0} days ago",
    "för {0} dagar sedan",
    "{0} 日前"
  ],
  "{0}{1}月{2}日": [
    "{0}{1}月{2}日",
    "{0}{1}/{2}",
    "{0}{2}/{1}",
    "{0}{1}月{2}日"
  ],
  "{0}年": [
    "{0}年",
    "{0}/",
    "{0}/",
    "{0}年"
  ],
  "权限": [
    "許可權",
    "Permissions",
    "Behörigheter",
    "権限"
  ],
  "协作": [
    "協作",
    "Collaboration",
    "Samarbete",
    "共同作業"
  ],
  "快速": [
    "快速",
    "Fast",
    "Snabb",
    "高速"
  ],
  "环境": [
    "環境",
    "Environment",
    "Miljö",
    "環境"
  ],
  "最低": [
    "最低",
    "Minimal",
    "Minimal",
    "最小"
  ],
  "低": [
    "低",
    "Low",
    "Låg",
    "低"
  ],
  "中": [
    "中",
    "Medium",
    "Medel",
    "中"
  ],
  "高": [
    "高",
    "High",
    "Hög",
    "高"
  ],
  "最高": [
    "最高",
    "Highest",
    "Högst",
    "最高"
  ],
  "只读": [
    "只讀",
    "Read-only",
    "Skrivskyddad",
    "読み取り専用"
  ],
  "自动": [
    "自動",
    "Auto",
    "Automatisk",
    "自動"
  ],
  "完全访问": [
    "完全訪問",
    "Full access",
    "Full åtkomst",
    "完全アクセス"
  ],
  "命令": [
    "命令",
    "Command",
    "Kommando",
    "コマンド"
  ],
  "读取了 {0} 个文件": [
    "讀取了 {0} 個檔案",
    "Files read: {0}",
    "Lästa filer: {0}",
    "{0} ファイルを読み取り"
  ],
  "{0}搜索 {1} 次": [
    "{0}搜尋 {1} 次",
    "{0}Searches: {1}",
    "{0}Sökningar: {1}",
    "{0}{1} 回検索"
  ],
  "进行了": [
    "進行了",
    "",
    "",
    "検索を"
  ],
  "访问网页 {0} 次": [
    "訪問網頁 {0} 次",
    "Web pages visited: {0}",
    "Besökta webbsidor: {0}",
    "{0} 回ウェブにアクセス"
  ],
  "其他 {0} 步": [
    "其他 {0} 步",
    "Other steps: {0}",
    "Övriga steg: {0}",
    "その他 {0} ステップ"
  ],
  "{0} 个步骤": [
    "{0} 個步驟",
    "Steps: {0}",
    "Steg: {0}",
    "{0} ステップ"
  ],
  "{0} {1}没成功，到“设置 → Agent”里点“查看”看输出": [
    "{0} {1}沒成功，到“設定 → Agent”裡點“檢視”看輸出",
    "{0} {1} failed. Go to Settings → Agent → View to inspect the output.",
    "{0} {1} misslyckades. Öppna Inställningar → Agent → Visa för utdata.",
    "{0} の{1}に失敗しました。「設定 → Agent → 表示」で出力を確認してください"
  ],
  "调整输入区高度，当前 {0} 像素": [
    "調整輸入區高度，當前 {0} 畫素",
    "Resize input area, currently {0} pixels",
    "Ändra inmatningshöjd, nu {0} pixlar",
    "入力欄の高さを調整、現在 {0} ピクセル"
  ],
  "上下拖动调整高度；点击展开或收起；方向键微调，Esc 恢复自动高度": [
    "上下拖動調整高度；點選展開或收起；方向鍵微調，Esc 恢復自動高度",
    "Drag vertically to resize; click to expand or collapse; arrow keys adjust, Esc resets to automatic height",
    "Dra lodrätt för storlek; klicka för att fälla ut eller ihop; piltangenter justerar, Esc återställer automatisk höjd",
    "上下にドラッグで調整、クリックで開閉、矢印キーで微調整、Esc で自動の高さに戻す"
  ],
  "读取失败": [
    "讀取失敗",
    "Read failed",
    "Läsningen misslyckades",
    "読み取りに失敗しました"
  ],
  "处理服务端消息出错": [
    "處理服務端訊息出錯",
    "Failed to process server message",
    "Kunde inte behandla servermeddelandet",
    "サーバーメッセージの処理に失敗しました"
  ],
  "OpenAI Chat Completions 兼容": [
    "OpenAI Chat Completions 相容",
    "OpenAI Chat Completions compatible",
    "OpenAI Chat Completions-kompatibel",
    "OpenAI Chat Completions 互換"
  ],
  "OpenAI Responses 兼容": [
    "OpenAI Responses 相容",
    "OpenAI Responses compatible",
    "OpenAI Responses-kompatibel",
    "OpenAI Responses 互換"
  ],
  "Anthropic Messages 兼容": [
    "Anthropic Messages 相容",
    "Anthropic Messages compatible",
    "Anthropic Messages-kompatibel",
    "Anthropic Messages 互換"
  ],
  "项目自带 CLI 与 ACP 接入程序，随应用一起安装；可登录 ChatGPT 或配置模型供应商。": [
    "專案自帶 CLI 與 ACP 接入程式，隨應用一起安裝；可登入 ChatGPT 或配置模型供應商。",
    "Bundled CLI and ACP adapter, installed with the app. Sign in with ChatGPT or configure a provider.",
    "Medföljande CLI och ACP-adapter installeras med appen. Logga in med ChatGPT eller konfigurera en leverantör.",
    "CLI と ACP アダプターをアプリに同梱。ChatGPT ログインまたはプロバイダー設定を利用できます。"
  ],
  "Pi / 开源社区": [
    "Pi / 開源社群",
    "Pi / Open-source community",
    "Pi / Öppen källkod-gemenskap",
    "Pi / オープンソースコミュニティ"
  ],
  "安装命令同时安装 Pi 与 ACP 适配器；通过 Pi 自己的设置向导配置模型。": [
    "安裝命令同時安裝 Pi 與 ACP 介面卡；通過 Pi 自己的設定嚮導配置模型。",
    "Installs Pi and its ACP adapter. Configure models in Pi's own wizard.",
    "Installerar Pi och dess ACP-adapter. Konfigurera modeller i Pis egen guide.",
    "Pi と ACP アダプターをインストールします。モデルは Pi のウィザードで設定できます。"
  ],
  "腾讯": [
    "騰訊",
    "Tencent",
    "Tencent",
    "Tencent"
  ],
  "安装命令同时安装 Claude Code 与 ACP 适配器；需登录账号或配置兼容供应商。": [
    "安裝命令同時安裝 Claude Code 與 ACP 介面卡；需登入賬號或配置相容供應商。",
    "Installs Claude Code and its ACP adapter. Sign in or configure a compatible provider.",
    "Installerar Claude Code och ACP-adaptern. Logga in eller konfigurera en kompatibel leverantör.",
    "Claude Code と ACP アダプターをインストールします。ログインまたは互換プロバイダーの設定が必要です。"
  ],
  "阿里 · 通义千问": [
    "阿里 · 通義千問",
    "Alibaba · Qwen",
    "Alibaba · Qwen",
    "Alibaba · Qwen"
  ],
  "月之暗面": [
    "月之暗面",
    "Moonshot AI",
    "Moonshot AI",
    "Moonshot AI"
  ],
  "使用当前 Kimi Code 的 Node.js CLI；安装后登录 Kimi 账号。": [
    "使用當前 Kimi Code 的 Node.js CLI；安裝後登入 Kimi 賬號。",
    "Uses the current Node.js Kimi Code CLI. Sign in to Kimi after installation.",
    "Använder aktuella Kimi Code CLI för Node.js. Logga in på Kimi efter installation.",
    "現在の Node.js 版 Kimi Code CLI を使用します。インストール後に Kimi にログインしてください。"
  ],
  "使用 MiniMax 官方安装器；通过 mcode acp 接入，安装后需账号或 API Key。": [
    "使用 MiniMax 官方安裝器；通過 mcode acp 接入，安裝後需賬號或 API Key。",
    "Official MiniMax installer with mcode acp. Requires an account or API key.",
    "Officiell MiniMax-installation med mcode acp. Kräver konto eller API-nyckel.",
    "公式 MiniMax インストーラーと mcode acp を使用します。アカウントまたは API キーが必要です。"
  ],
  "小米": [
    "小米",
    "Xiaomi",
    "Xiaomi",
    "Xiaomi"
  ],
  "官方 CLI 支持 mimo acp，安装后配置 MiMo 账号或 API Key。": [
    "官方 CLI 支援 mimo acp，安裝後配置 MiMo 賬號或 API Key。",
    "Official CLI supports mimo acp. Configure a MiMo account or API key after installation.",
    "Officiellt CLI stöder mimo acp. Konfigurera MiMo-konto eller API-nyckel efter installation.",
    "公式 CLI は mimo acp に対応しています。インストール後に MiMo アカウントまたは API キーを設定してください。"
  ],
  "开发者预览版；使用已发布的 dsh 与 --profile acp，需配置模型。": [
    "開發者預覽版；使用已釋出的 dsh 與 --profile acp，需配置模型。",
    "Developer preview using the published dsh and --profile acp. Configure a model first.",
    "Utvecklarförhandsversion med publicerad dsh och --profile acp. Konfigurera modellen först.",
    "開発者プレビュー版。公開済みの dsh と --profile acp を使用します。モデル設定が必要です。"
  ],
  "Qoder 国际版，支持 --acp；需要账号或访问令牌。": [
    "Qoder 國際版，支援 --acp；需要賬號或訪問令牌。",
    "International Qoder CLI supports --acp. Requires an account or access token.",
    "Internationella Qoder CLI stöder --acp. Kräver konto eller åtkomsttoken.",
    "国際版 Qoder CLI は --acp に対応。アカウントまたはアクセストークンが必要です。"
  ],
  "Qoder 国内版，支持 --acp；需要账号或访问令牌。": [
    "Qoder 國內版，支援 --acp；需要賬號或訪問令牌。",
    "China Qoder CLI supports --acp. Requires an account or access token.",
    "Kinesiska Qoder CLI stöder --acp. Kräver konto eller åtkomsttoken.",
    "中国版 Qoder CLI は --acp に対応。アカウントまたはアクセストークンが必要です。"
  ],
  "TRAE · 字节跳动": [
    "TRAE · 字節跳動",
    "TRAE · ByteDance",
    "TRAE · ByteDance",
    "TRAE · ByteDance"
  ],
  "使用 TRAE Code 2.0 的官方 CLI，通过 traecli acp serve 接入；需登录或配置访问令牌。": [
    "使用 TRAE Code 2.0 的官方 CLI，通過 traecli acp serve 接入；需登入或配置訪問令牌。",
    "Official TRAE Code 2.0 CLI via traecli acp serve. Sign in or configure an access token.",
    "Officiella TRAE Code 2.0 CLI via traecli acp serve. Logga in eller konfigurera åtkomsttoken.",
    "公式 TRAE Code 2.0 CLI の traecli acp serve を使用。ログインまたはアクセストークンが必要です。"
  ],
  "开源编程 Agent，原生支持 opencode acp；可配置多家模型供应商。": [
    "開源程式設計 Agent，原生支援 opencode acp；可配置多家模型供應商。",
    "Open-source coding agent with native opencode acp and multiple model providers.",
    "Kodningsagent med öppen källkod, inbyggd opencode acp och flera modellleverantörer.",
    "オープンソースの開発エージェント。opencode acp と複数のモデルプロバイダーに対応しています。"
  ],
  "使用官方安装器提供的 cursor-agent acp；需登录 Cursor。避免把其他产品的同名 agent 命令误认为 Cursor。": [
    "使用官方安裝器提供的 cursor-agent acp；需登入 Cursor。避免把其他產品的同名 agent 命令誤認為 Cursor。",
    "Uses the official cursor-agent acp installer. Sign in to Cursor. Do not confuse it with other products' agent commands.",
    "Använder officiella cursor-agent acp. Logga in på Cursor. Blanda inte ihop med andra produkters agent-kommandon.",
    "公式インストーラーの cursor-agent acp を使用します。Cursor へのログインが必要です。他製品の agent コマンドと混同しないでください。"
  ],
  "原生支持 --acp；安装后登录 Augment 账号。": [
    "原生支援 --acp；安裝後登入 Augment 賬號。",
    "Native --acp support. Sign in to Augment after installation.",
    "Inbyggt --acp-stöd. Logga in på Augment efter installation.",
    "--acp に対応。インストール後に Augment にログインしてください。"
  ],
  "原生支持 --acp；安装后完成 Cline 的模型供应商配置。": [
    "原生支援 --acp；安裝後完成 Cline 的模型供應商配置。",
    "Native --acp support. Configure Cline's model provider after installation.",
    "Inbyggt --acp-stöd. Konfigurera Clines modellleverantör efter installation.",
    "--acp に対応。インストール後に Cline のモデルプロバイダーを設定してください。"
  ],
  "原生支持 kilo acp；安装后登录或配置模型供应商。": [
    "原生支援 kilo acp；安裝後登入或配置模型供應商。",
    "Native kilo acp support. Sign in or configure a provider after installation.",
    "Inbyggt kilo acp-stöd. Logga in eller konfigurera leverantör efter installation.",
    "kilo acp に対応。インストール後にログインまたはプロバイダーを設定してください。"
  ],
  "使用 xAI 官方包 @xai-official/grok，通过 grok agent stdio 接入 ACP；需登录或 API Key。": [
    "使用 xAI 官方包 @xai-official/grok，通過 grok agent stdio 接入 ACP；需登入或 API Key。",
    "Official xAI @xai-official/grok package with grok agent stdio ACP. Requires sign-in or API key.",
    "Officiellt xAI-paket @xai-official/grok med grok agent stdio ACP. Kräver inloggning eller API-nyckel.",
    "公式 xAI パッケージ @xai-official/grok の grok agent stdio で ACP に接続。ログインまたは API キーが必要です。"
  ],
  "使用官方原生二进制安装器，无需先安装 Bun；支持 omp acp，需配置模型。": [
    "使用官方原生二進位制安裝器，無需先安裝 Bun；支援 omp acp，需配置模型。",
    "Official native binary installer, no Bun required. Supports omp acp; configure a model.",
    "Officiell binärinstallation utan krav på Bun. Stöder omp acp; konfigurera en modell.",
    "公式バイナリインストーラーを使用し、Bun は不要です。omp acp に対応。モデル設定が必要です。"
  ],
  "通过 uv 安装并管理 Python 3.12；原生支持 openhands acp，需先完成 OpenHands 的模型设置。": [
    "通過 uv 安裝並管理 Python 3.12；原生支援 openhands acp，需先完成 OpenHands 的模型設定。",
    "Installs and manages Python 3.12 with uv. Supports openhands acp; configure OpenHands models first.",
    "Installerar och hanterar Python 3.12 med uv. Stöder openhands acp; konfigurera modeller först.",
    "uv で Python 3.12 を管理します。openhands acp に対応。先に OpenHands のモデルを設定してください。"
  ],
  "使用官方安装器，跳过初始向导；原生支持 interpreter acp，需配置模型。": [
    "使用官方安裝器，跳過初始嚮導；原生支援 interpreter acp，需配置模型。",
    "Official installer skips initial wizard. Supports interpreter acp; configure a model.",
    "Officiell installation hoppar över första guiden. Stöder interpreter acp; konfigurera en modell.",
    "公式インストーラーで初回ウィザードを省略。interpreter acp に対応。モデル設定が必要です。"
  ],
  "使用 LangChain 已发布的 JavaScript ACP 包，安装后配置模型供应商。": [
    "使用 LangChain 已釋出的 JavaScript ACP 包，安裝後配置模型供應商。",
    "Published LangChain JavaScript ACP package. Configure a provider after installation.",
    "Publicerat JavaScript ACP-paket från LangChain. Konfigurera leverantör efter installation.",
    "LangChain の公開済み JavaScript ACP パッケージを使用。インストール後にプロバイダーを設定してください。"
  ],
  "Kimi（月之暗面）": [
    "Kimi（月之暗面）",
    "Kimi (Moonshot AI)",
    "Kimi (Moonshot AI)",
    "Kimi（Moonshot AI）"
  ],
  "这是国内平台（platform.moonshot.cn）的地址。Key 是在国际平台建的，地址改成 https://api.moonshot.ai/v1。": [
    "這是國內平臺（platform.moonshot.cn）的地址。Key 是在國際平臺建的，地址改成 https://api.moonshot.ai/v1。",
    "China platform URL (platform.moonshot.cn). For keys from the international platform, use https://api.moonshot.ai/v1.",
    "Adress för Kina (platform.moonshot.cn). För internationella nycklar, använd https://api.moonshot.ai/v1.",
    "中国向け platform.moonshot.cn の URL です。国際版のキーは https://api.moonshot.ai/v1 を使用してください。"
  ],
  "智谱 GLM（编程套餐）": [
    "智譜 GLM（程式設計套餐）",
    "Zhipu GLM (Coding Plan)",
    "Zhipu GLM (Coding Plan)",
    "Zhipu GLM（Coding Plan）"
  ],
  "这个地址是 GLM 编程套餐专用的。": [
    "這個地址是 GLM 程式設計套餐專用的。",
    "This URL is exclusive to GLM Coding Plan.",
    "Adressen är endast för GLM Coding Plan.",
    "この URL は GLM Coding Plan 専用です。"
  ],
  "阿里云百炼": [
    "阿里雲百鍊",
    "Alibaba Cloud Bailian",
    "Alibaba Cloud Bailian",
    "Alibaba Cloud Bailian"
  ],
  "把地址里的 <业务空间 ID> 换成百炼控制台里你的业务空间 ID。用 Token Plan 的，地址是 https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1。": [
    "把地址裡的 <業務空間 ID> 換成百鍊控制台裡你的業務空間 ID。用 Token Plan 的，地址是 https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1。",
    "Replace <业务空间 ID> in the URL with your Bailian workspace ID. Token Plan uses https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1.",
    "Ersätt <业务空间 ID> med ditt Bailian-arbetsyte-ID. Token Plan använder https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1.",
    "URL の <业务空间 ID> を Bailian コンソールのワークスペース ID に置き換えてください。Token Plan は https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1 を使用します。"
  ],
  "智谱 GLM Coding Plan（国内）": [
    "智譜 GLM Coding Plan（國內）",
    "Zhipu GLM Coding Plan (China)",
    "Zhipu GLM Coding Plan (Kina)",
    "Zhipu GLM Coding Plan（中国）"
  ],
  "使用国内 GLM Coding Plan 的套餐 Key，普通 API 与套餐 Key 的使用范围不同。": [
    "使用國內 GLM Coding Plan 的套餐 Key，普通 API 與套餐 Key 的使用範圍不同。",
    "Use a China GLM Coding Plan key. Regular API keys and plan keys have different scopes.",
    "Använd en kinesisk GLM Coding Plan-nyckel. Vanliga API-nycklar och plannycklar har olika användningsområden.",
    "中国版 GLM Coding Plan のキーを使用してください。通常の API キーとは利用範囲が異なります。"
  ],
  "Z.AI Coding Plan（国际）": [
    "Z.AI Coding Plan（國際）",
    "Z.AI Coding Plan (International)",
    "Z.AI Coding Plan (Internationell)",
    "Z.AI Coding Plan（国際版）"
  ],
  "使用 Z.AI 国际平台的 Coding Plan Key。": [
    "使用 Z.AI 國際平臺的 Coding Plan Key。",
    "Use a Z.AI international Coding Plan key.",
    "Använd en internationell Z.AI Coding Plan-nyckel.",
    "Z.AI 国際版の Coding Plan キーを使用してください。"
  ],
  "填 Kimi Code 的套餐 Key。Moonshot 开放平台的普通 API Key 对应另一个接口。账号登录请使用 Agent 原生登录。": [
    "填 Kimi Code 的套餐 Key。Moonshot 開放平臺的普通 API Key 對應另一個介面。賬號登入請使用 Agent 原生登入。",
    "Enter a Kimi Code plan key. Regular Moonshot API keys use another endpoint. Use native sign-in for account access.",
    "Ange Kimi Code-plannyckel. Vanliga Moonshot API-nycklar använder en annan adress. Använd agentens inloggning för kontoåtkomst.",
    "Kimi Code プランのキーを入力してください。通常の Moonshot API キーは別の URL を使用します。アカウント認証にはエージェントのログインを使用してください。"
  ],
  "MiniMax Coding Plan（国内）": [
    "MiniMax Coding Plan（國內）",
    "MiniMax Coding Plan (China)",
    "MiniMax Coding Plan (Kina)",
    "MiniMax Coding Plan（中国）"
  ],
  "使用国内 MiniMax Coding Plan 的 Key，套餐和普通 API 计费分别管理。": [
    "使用國內 MiniMax Coding Plan 的 Key，套餐和普通 API 計費分別管理。",
    "Use a China MiniMax Coding Plan key. Plan and API billing are managed separately.",
    "Använd kinesisk MiniMax Coding Plan-nyckel. Plan- och API-debitering hanteras separat.",
    "中国版 MiniMax Coding Plan のキーを使用してください。プランと通常の API は別課金です。"
  ],
  "使用 Kimi Code 套餐 Key；模型、上下文长度和高速模式以你的套餐权限为准。": [
    "使用 Kimi Code 套餐 Key；模型、上下文長度和高速模式以你的套餐許可權為準。",
    "Use a Kimi Code plan key. Available models, context and fast mode depend on your plan.",
    "Använd Kimi Code-plannyckel. Modeller, kontext och snabbt läge beror på planen.",
    "Kimi Code プランのキーを使用してください。利用可能なモデル、コンテキスト、高速モードはプランに依存します。"
  ],
  "MiniMax Coding Plan（国际）": [
    "MiniMax Coding Plan（國際）",
    "MiniMax Coding Plan (International)",
    "MiniMax Coding Plan (Internationell)",
    "MiniMax Coding Plan（国際版）"
  ],
  "使用国际 MiniMax Coding Plan 的 Key。": [
    "使用國際 MiniMax Coding Plan 的 Key。",
    "Use an international MiniMax Coding Plan key.",
    "Använd internationell MiniMax Coding Plan-nyckel.",
    "国際版 MiniMax Coding Plan のキーを使用してください。"
  ],
  "阿里云百炼 Token Plan（国内）": [
    "阿里雲百鍊 Token Plan（國內）",
    "Alibaba Cloud Bailian Token Plan (China)",
    "Alibaba Cloud Bailian Token Plan (Kina)",
    "Alibaba Cloud Bailian Token Plan（中国）"
  ],
  "使用 Token Plan 的套餐 Key；普通百炼 API Key 不能替代套餐 Key。": [
    "使用 Token Plan 的套餐 Key；普通百鍊 API Key 不能替代套餐 Key。",
    "Use a Token Plan key. Regular Bailian API keys cannot replace plan keys.",
    "Använd Token Plan-nyckel. Vanliga Bailian API-nycklar kan inte ersätta plannycklar.",
    "Token Plan のキーを使用してください。通常の Bailian API キーは代用できません。"
  ],
  "MiMo Token Plan（国内）": [
    "MiMo Token Plan（國內）",
    "MiMo Token Plan (China)",
    "MiMo Token Plan (Kina)",
    "MiMo Token Plan（中国）"
  ],
  "使用 MiMo 国内 Token Plan 的套餐 Key。": [
    "使用 MiMo 國內 Token Plan 的套餐 Key。",
    "Use a China MiMo Token Plan key.",
    "Använd kinesisk MiMo Token Plan-nyckel.",
    "中国版 MiMo Token Plan のキーを使用してください。"
  ],
  "Moonshot API（国内）": [
    "Moonshot API（國內）",
    "Moonshot API (China)",
    "Moonshot API (Kina)",
    "Moonshot API（中国）"
  ],
  "使用 Moonshot 国内开放平台的 API Key，按 API 用量计费。": [
    "使用 Moonshot 國內開放平臺的 API Key，按 API 用量計費。",
    "Use a China Moonshot API key with usage-based billing.",
    "Använd kinesisk Moonshot API-nyckel med användningsbaserad debitering.",
    "中国版 Moonshot API キーを使用します。従量課金です。"
  ],
  "Moonshot API（国际）": [
    "Moonshot API（國際）",
    "Moonshot API (International)",
    "Moonshot API (Internationell)",
    "Moonshot API（国際版）"
  ],
  "模型可用范围以你的 OpenRouter 账号为准，模型列表仅作参考。": [
    "模型可用範圍以你的 OpenRouter 賬號為準，模型列表僅作參考。",
    "Available models depend on your OpenRouter account. The list is for reference only.",
    "Tillgängliga modeller beror på ditt OpenRouter-konto. Listan är bara vägledande.",
    "利用可能なモデルは OpenRouter アカウントによります。一覧は参考情報です。"
  ],
  "这里填写 OpenAI API Key。ChatGPT 订阅账号请使用 Agent 原生登录。": [
    "這裡填寫 OpenAI API Key。ChatGPT 訂閱賬號請使用 Agent 原生登入。",
    "Enter an OpenAI API key here. Use native sign-in for a ChatGPT subscription.",
    "Ange OpenAI API-nyckel här. Använd agentens inloggning för ChatGPT-abonnemang.",
    "OpenAI API キーを入力します。ChatGPT サブスクリプションにはエージェントのログインを使用してください。"
  ],
  "这里填写 Anthropic API Key。Claude 订阅账号由 Agent 原生登录处理。": [
    "這裡填寫 Anthropic API Key。Claude 訂閱賬號由 Agent 原生登入處理。",
    "Enter an Anthropic API key here. Claude subscription sign-in is managed by the agent.",
    "Ange Anthropic API-nyckel här. Agenten hanterar Claude-abonnemangsinloggning.",
    "Anthropic API キーを入力します。Claude サブスクリプションのログインはエージェントが管理します。"
  ],
  "这里填写 Gemini API Key。Google 账号登录请使用 Agent 原生登录。": [
    "這裡填寫 Gemini API Key。Google 賬號登入請使用 Agent 原生登入。",
    "Enter a Gemini API key here. Use native sign-in for Google accounts.",
    "Ange Gemini API-nyckel här. Använd agentens inloggning för Google-konton.",
    "Gemini API キーを入力します。Google アカウントにはエージェントのログインを使用してください。"
  ],
  "其他兼容接口": [
    "其他相容介面",
    "Other compatible API",
    "Annat kompatibelt API",
    "その他の互換 API"
  ],
  "按供应商文档选择接口类型、地址和模型。只有这个 Agent 支持的接口才可以选择。": [
    "按供應商文件選擇介面型別、地址和模型。只有這個 Agent 支援的接口才可以選擇。",
    "Follow the provider's docs for protocol, URL and model. Only protocols supported by this agent are available.",
    "Följ leverantörens dokumentation för protokoll, adress och modell. Bara agentens stödda protokoll kan väljas.",
    "プロバイダーのドキュメントに沿って種類、URL、モデルを選択してください。エージェントが対応する API のみ選択できます。"
  ],
  "第三方 API 或订阅套餐需要提供 Responses 兼容接口。ChatGPT 订阅请通过 Codex 自己的登录方式接入。": [
    "第三方 API 或訂閱套餐需要提供 Responses 相容介面。ChatGPT 訂閱請通過 Codex 自己的登入方式接入。",
    "Third-party APIs or plans must provide a Responses-compatible endpoint. Use Codex's own sign-in for ChatGPT subscriptions.",
    "Tredjeparts-API eller planer måste erbjuda ett Responses-kompatibelt API. Använd Codex egen inloggning för ChatGPT-abonnemang.",
    "外部 API やプランには Responses 互換 URL が必要です。ChatGPT サブスクリプションは Codex 自身のログインを使用してください。"
  ],
  "通过独立 Pi 配置目录接入兼容 API；官方订阅继续使用 Pi 自己的登录。": [
    "通過獨立 Pi 配置目錄接入相容 API；官方訂閱繼續使用 Pi 自己的登入。",
    "Compatible APIs use an isolated Pi configuration. Official subscriptions use Pi's own sign-in.",
    "Kompatibla API använder separat Pi-konfiguration. Officiella abonnemang använder Pis inloggning.",
    "互換 API は独立した Pi 設定を使用します。公式サブスクリプションは Pi 自身のログインを使用してください。"
  ],
  "在独立 Hermes 目录配置第三方模型，支持 Chat、Responses 和 Anthropic 接口。": [
    "在獨立 Hermes 目錄配置第三方模型，支援 Chat、Responses 和 Anthropic 介面。",
    "Isolated Hermes configuration supports third-party Chat, Responses and Anthropic APIs.",
    "Separat Hermes-konfiguration stöder externa Chat-, Responses- och Anthropic-API.",
    "独立した Hermes 設定で外部の Chat、Responses、Anthropic API に接続します。"
  ],
  "使用独立 Qwen 配置接入 OpenAI、Anthropic 或 Gemini 兼容模型。": [
    "使用獨立 Qwen 配置接入 OpenAI、Anthropic 或 Gemini 相容模型。",
    "Isolated Qwen configuration supports OpenAI, Anthropic and Gemini-compatible models.",
    "Separat Qwen-konfiguration stöder OpenAI-, Anthropic- och Gemini-kompatibla modeller.",
    "独立した Qwen 設定で OpenAI、Anthropic、Gemini 互換モデルに接続します。"
  ],
  "支持第三方 Chat Completions 和 Anthropic 模型；配置与原 CodeBuddy 账号隔离。": [
    "支援第三方 Chat Completions 和 Anthropic 模型；配置與原 CodeBuddy 賬號隔離。",
    "Supports third-party Chat Completions and Anthropic models, isolated from the original CodeBuddy account.",
    "Stöder externa Chat Completions- och Anthropic-modeller, separat från ursprungligt CodeBuddy-konto.",
    "外部の Chat Completions と Anthropic モデルに対応します。元の CodeBuddy アカウントとは設定を分離します。"
  ],
  "在独立 Kimi Code 目录配置第三方 API；凭据只通过声明的环境变量读取。": [
    "在獨立 Kimi Code 目錄配置第三方 API；憑據只通過宣告的環境變數讀取。",
    "Third-party APIs use an isolated Kimi Code directory. Credentials are read only from declared environment variables.",
    "Externa API använder separat Kimi Code-katalog. Uppgifter läses bara från angivna miljövariabler.",
    "外部 API は独立した Kimi Code ディレクトリを使用します。認証情報は指定した環境変数からのみ読み取ります。"
  ],
  "支持三种兼容接口；MiniMax 要求的 API Key 只存于应用私有配置文件。": [
    "支援三種相容介面；MiniMax 要求的 API Key 只存於應用私有配置檔案。",
    "Supports three compatible protocols. MiniMax's required API key is stored only in the app's private configuration.",
    "Stöder tre kompatibla protokoll. MiniMax API-nyckel sparas bara i appens privata konfiguration.",
    "3種類の互換 API に対応します。MiniMax の API キーはアプリの非公開設定にのみ保存されます。"
  ],
  "通过独立 MiMo 配置接入第三方 Chat 或 Anthropic 模型。": [
    "通過獨立 MiMo 配置接入第三方 Chat 或 Anthropic 模型。",
    "Isolated MiMo configuration supports third-party Chat and Anthropic models.",
    "Separat MiMo-konfiguration stöder externa Chat- och Anthropic-modeller.",
    "独立した MiMo 設定で外部の Chat または Anthropic モデルに接続します。"
  ],
  "使用独立 Harness profile 与内置 Pi AI 适配器接入第三方兼容 API。": [
    "使用獨立 Harness profile 與內建 Pi AI 介面卡接入第三方相容 API。",
    "Uses an isolated Harness profile and bundled Pi AI adapter for compatible APIs.",
    "Använder separat Harness-profil och medföljande Pi AI-adapter för kompatibla API.",
    "独立した Harness プロファイルと同梱の Pi AI アダプターで互換 API に接続します。"
  ],
  "配置模型与订阅": [
    "配置模型與訂閱",
    "Configure models and subscriptions",
    "Konfigurera modeller och abonnemang",
    "モデル・サブスクリプションを設定"
  ],
  "进入 Pi 后使用 /login 登录支持的订阅，再通过 /model 选择模型。": [
    "進入 Pi 後使用 /login 登入支援的訂閱，再通過 /model 選擇模型。",
    "In Pi, use /login for supported subscriptions, then /model to select a model.",
    "I Pi, använd /login för stödda abonnemang och sedan /model för modellval.",
    "Pi で /login を使ってサブスクリプションにログインし、/model でモデルを選択します。"
  ],
  "选择官方订阅登录、API Key 或自定义 endpoint。": [
    "選擇官方訂閱登入、API Key 或自定義 endpoint。",
    "Choose subscription sign-in, API key or a custom endpoint.",
    "Välj abonnemangsinloggning, API-nyckel eller egen adress.",
    "公式サブスクリプション、API キー、独自 URL を選択します。"
  ],
  "进入 CodeBuddy 后使用 /login 登录，或使用 /model 管理模型。": [
    "進入 CodeBuddy 後使用 /login 登入，或使用 /model 管理模型。",
    "In CodeBuddy, use /login to sign in or /model to manage models.",
    "I CodeBuddy, använd /login för inloggning eller /model för modeller.",
    "CodeBuddy の /login でログイン、/model でモデルを管理します。"
  ],
  "进入后使用 /auth 配置百炼 Coding Plan、Token Plan 或第三方 API，再使用 /model 选择模型。": [
    "進入後使用 /auth 配置百鍊 Coding Plan、Token Plan 或第三方 API，再使用 /model 選擇模型。",
    "Use /auth for Bailian Coding Plan, Token Plan or third-party API, then /model to choose a model.",
    "Använd /auth för Bailian Coding Plan, Token Plan eller externt API, sedan /model för modellval.",
    "/auth で Bailian Coding Plan、Token Plan、外部 API を設定し、/model でモデルを選びます。"
  ],
  "进入后使用 /login 登录 Kimi Code 订阅，或 /provider 管理第三方模型。": [
    "進入後使用 /login 登入 Kimi Code 訂閱，或 /provider 管理第三方模型。",
    "Use /login for Kimi Code subscriptions or /provider for third-party models.",
    "Använd /login för Kimi Code-abonnemang eller /provider för externa modeller.",
    "/login で Kimi Code にログインするか、/provider で外部モデルを管理します。"
  ],
  "登录 MiniMax 国内账号": [
    "登入 MiniMax 國內賬號",
    "Sign in to MiniMax China",
    "Logga in på MiniMax Kina",
    "MiniMax 中国版にログイン"
  ],
  "使用国内 MiniMax 账号和 Token Plan。": [
    "使用國內 MiniMax 賬號和 Token Plan。",
    "Use a China MiniMax account and Token Plan.",
    "Använd kinesiskt MiniMax-konto och Token Plan.",
    "中国版 MiniMax アカウントと Token Plan を使用します。"
  ],
  "登录 MiniMax 国际账号": [
    "登入 MiniMax 國際賬號",
    "Sign in to MiniMax International",
    "Logga in på MiniMax internationellt",
    "MiniMax 国際版にログイン"
  ],
  "使用国际 MiniMax 账号和 Token Plan。": [
    "使用國際 MiniMax 賬號和 Token Plan。",
    "Use an international MiniMax account and Token Plan.",
    "Använd internationellt MiniMax-konto och Token Plan.",
    "国際版 MiniMax アカウントと Token Plan を使用します。"
  ],
  "进入后使用 /model 或 /provider 选择官方订阅与第三方模型。": [
    "進入後使用 /model 或 /provider 選擇官方訂閱與第三方模型。",
    "Use /model or /provider to select subscriptions and third-party models.",
    "Använd /model eller /provider för abonnemang och externa modeller.",
    "/model または /provider でサブスクリプションや外部モデルを選択します。"
  ],
  "进入后使用 /connect 连接供应商，再使用 /models 选择模型。": [
    "進入後使用 /connect 連線供應商，再使用 /models 選擇模型。",
    "Use /connect to connect a provider, then /models to select a model.",
    "Använd /connect för leverantör och sedan /models för modellval.",
    "/connect でプロバイダーに接続し、/models でモデルを選びます。"
  ],
  "使用 /login 登录，再用 /model → Custom 添加 BYOK；需 Individual 计划，模型以账号目录为准。": [
    "使用 /login 登入，再用 /model → Custom 新增 BYOK；需 Individual 計劃，模型以賬號目錄為準。",
    "Use /login, then /model → Custom to add BYOK. Individual plan required; models depend on your account.",
    "Använd /login och sedan /model → Custom för BYOK. Kräver Individual-plan; modeller beror på kontot.",
    "/login の後、/model → Custom で BYOK を追加します。Individual プランが必要で、利用モデルはアカウントによります。"
  ],
  "使用 /login 登录 TRAE 账号，通过 /model 选择账号可用模型。": [
    "使用 /login 登入 TRAE 賬號，通過 /model 選擇賬號可用模型。",
    "Use /login for your TRAE account and /model for available models.",
    "Använd /login för TRAE-konto och /model för tillgängliga modeller.",
    "/login で TRAE にログインし、/model で利用可能なモデルを選びます。"
  ],
  "通过独立进程配置接入兼容供应商；原生账号和订阅请使用该 Agent 的登录入口。": [
    "通過獨立程序配置接入相容供應商；原生賬號和訂閱請使用該 Agent 的登入入口。",
    "Isolated process configuration connects compatible providers. Use the agent's sign-in for native accounts and subscriptions.",
    "Separat processkonfiguration ansluter kompatibla leverantörer. Använd agentens inloggning för konton och abonnemang.",
    "独立したプロセス設定で互換プロバイダーに接続します。公式アカウントやサブスクリプションにはエージェントのログインを使用してください。"
  ],
  "使用独立 Grok 配置接入第三方 Chat、Responses 或 Anthropic API；原生 xAI 登录继续使用原有配置。": [
    "使用獨立 Grok 配置接入第三方 Chat、Responses 或 Anthropic API；原生 xAI 登入繼續使用原有配置。",
    "Isolated Grok configuration supports third-party Chat, Responses and Anthropic APIs. Native xAI sign-in keeps the original configuration.",
    "Separat Grok-konfiguration stöder externa Chat-, Responses- och Anthropic-API. xAI-inloggning använder ursprunglig konfiguration.",
    "独立した Grok 設定で外部の Chat、Responses、Anthropic API に接続。xAI ログインは本来の設定を使用します。"
  ],
  "使用 Anthropic Messages 兼容网关；供应商 Key 的计费与 Claude 原厂订阅分别管理。": [
    "使用 Anthropic Messages 相容閘道器；供應商 Key 的計費與 Claude 原廠訂閱分別管理。",
    "Uses an Anthropic Messages-compatible gateway. Provider key billing is separate from Claude subscriptions.",
    "Använder Anthropic Messages-kompatibel gateway. Leverantörsnyckel debiteras separat från Claude-abonnemang.",
    "Anthropic Messages 互換ゲートウェイを使用します。プロバイダーのキーと Claude サブスクリプションは別課金です。"
  ],
  "供应商必须实现 Gemini generateContent 协议；Google 账号和 Gemini API Key 使用不同的计费方式。": [
    "供應商必須實現 Gemini generateContent 協議；Google 賬號和 Gemini API Key 使用不同的計費方式。",
    "The provider must implement Gemini generateContent. Google accounts and Gemini API keys have different billing.",
    "Leverantören måste stödja Gemini generateContent. Google-konton och Gemini API-nycklar har olika debitering.",
    "Gemini generateContent 対応が必要です。Google アカウントと Gemini API キーは課金方式が異なります。"
  ],
  "Copilot CLI 支持本地 BYOK；模型需支持流式输出和工具调用，自带 Key 时无需 Copilot 订阅。": [
    "Copilot CLI 支援本地 BYOK；模型需支援流式輸出和工具呼叫，自帶 Key 時無需 Copilot 訂閱。",
    "Copilot CLI supports local BYOK. Models need streaming and tool calls; your own key needs no Copilot subscription.",
    "Copilot CLI stöder lokal BYOK. Modeller behöver strömning och verktygsanrop; egen nyckel kräver inget Copilot-abonnemang.",
    "Copilot CLI は BYOK に対応。ストリーミングとツール呼び出しが必要です。自分のキーを使う場合、Copilot サブスクリプションは不要です。"
  ],
  "通过 Responses 兼容接口接入模型；服务需要支持工具调用，账号订阅按供应商自己的规则使用。": [
    "通過 Responses 相容介面接入模型；服務需要支援工具呼叫，賬號訂閱按供應商自己的規則使用。",
    "Uses a Responses-compatible API with tool calls. Account subscriptions follow provider rules.",
    "Använder Responses-kompatibelt API med verktygsanrop. Abonnemang följer leverantörens regler.",
    "Responses 互換 API を使用します。ツール呼び出しに対応する必要があり、サブスクリプションはプロバイダーの規則に従います。"
  ],
  "使用 Cline 的独立本地供应商配置；其他供应商、Cline 账号和 ChatGPT 订阅可使用原生认证向导。": [
    "使用 Cline 的獨立本地供應商配置；其他供應商、Cline 賬號和 ChatGPT 訂閱可使用原生認證嚮導。",
    "Uses Cline's isolated local provider configuration. Native authentication handles other providers, Cline accounts and ChatGPT subscriptions.",
    "Använder Clines separata lokala leverantörskonfiguration. Agentens autentisering hanterar andra leverantörer, Cline-konton och ChatGPT-abonnemang.",
    "Cline の独立したローカル設定を使用します。他のプロバイダー、Cline アカウント、ChatGPT サブスクリプションは認証ウィザードを利用できます。"
  ],
  "原生模型设置": [
    "原生模型設定",
    "Native model setup",
    "Agentens modellinställningar",
    "エージェントのモデル設定"
  ],
  "启动 OpenCode，在 /connect 中连接供应商或订阅，再用 /models 选模型。": [
    "啟動 OpenCode，在 /connect 中連線供應商或訂閱，再用 /models 選模型。",
    "Start OpenCode, use /connect for providers or subscriptions and /models to select a model.",
    "Starta OpenCode, använd /connect för leverantör eller abonnemang och /models för modellval.",
    "OpenCode を起動し、/connect で接続、/models でモデルを選びます。"
  ],
  "选择 OpenCode 支持的原生账号或供应商。": [
    "選擇 OpenCode 支援的原生賬號或供應商。",
    "Choose an account or provider supported by OpenCode.",
    "Välj konto eller leverantör som OpenCode stöder.",
    "OpenCode が対応するアカウントまたはプロバイダーを選択します。"
  ],
  "在 Kilo 的原生设置中连接供应商并选择模型。": [
    "在 Kilo 的原生設定中連線供應商並選擇模型。",
    "Connect providers and select models in Kilo's own settings.",
    "Anslut leverantörer och välj modeller i Kilos inställningar.",
    "Kilo の設定でプロバイダーに接続し、モデルを選びます。"
  ],
  "Claude 账号登录": [
    "Claude 賬號登入",
    "Claude account sign-in",
    "Logga in med Claude-konto",
    "Claude アカウントでログイン"
  ],
  "使用适配器自带的 Claude CLI 完成原厂账号认证；供应商 Key 与订阅独立计费。": [
    "使用介面卡自帶的 Claude CLI 完成原廠賬號認證；供應商 Key 與訂閱獨立計費。",
    "Use the adapter's Claude CLI for account authentication. Provider keys and subscriptions are billed separately.",
    "Använd adapterns Claude CLI för kontoautentisering. Leverantörsnycklar och abonnemang debiteras separat.",
    "アダプター内の Claude CLI で公式アカウントを認証します。プロバイダーのキーとサブスクリプションは別課金です。"
  ],
  "Gemini 原生设置": [
    "Gemini 原生設定",
    "Gemini native setup",
    "Geminis inställningar",
    "Gemini の設定"
  ],
  "在 Gemini CLI 中选择 Google 账号、API Key 或 Vertex AI，并设置模型。": [
    "在 Gemini CLI 中選擇 Google 賬號、API Key 或 Vertex AI，並設定模型。",
    "In Gemini CLI, choose a Google account, API key or Vertex AI and configure models.",
    "I Gemini CLI, välj Google-konto, API-nyckel eller Vertex AI och konfigurera modeller.",
    "Gemini CLI で Google アカウント、API キー、Vertex AI を選び、モデルを設定します。"
  ],
  "GitHub 账号登录": [
    "GitHub 賬號登入",
    "GitHub account sign-in",
    "Logga in med GitHub-konto",
    "GitHub アカウントでログイン"
  ],
  "登录 GitHub Copilot 原厂账号；网页 BYOK 配置使用供应商自己的 Key。": [
    "登入 GitHub Copilot 原廠賬號；網頁 BYOK 配置使用供應商自己的 Key。",
    "Sign in to GitHub Copilot. Web BYOK uses your provider's own key.",
    "Logga in på GitHub Copilot. Webb-BYOK använder leverantörens egen nyckel.",
    "GitHub Copilot にログインします。ウェブの BYOK 設定にはプロバイダーのキーを使用します。"
  ],
  "Cline 认证与模型设置": [
    "Cline 認證與模型設定",
    "Cline authentication and models",
    "Cline-autentisering och modeller",
    "Cline の認証・モデル設定"
  ],
  "选择 Cline、ChatGPT 订阅、OCA 或供应商 API Key。": [
    "選擇 Cline、ChatGPT 訂閱、OCA 或供應商 API Key。",
    "Choose Cline, ChatGPT subscription, OCA or a provider API key.",
    "Välj Cline, ChatGPT-abonnemang, OCA eller leverantörens API-nyckel.",
    "Cline、ChatGPT サブスクリプション、OCA、API キーを選びます。"
  ],
  "ChatGPT 订阅登录": [
    "ChatGPT 訂閱登入",
    "ChatGPT subscription sign-in",
    "Logga in med ChatGPT-abonnemang",
    "ChatGPT サブスクリプションでログイン"
  ],
  "通过 Cline 原生 OAuth 接入 ChatGPT 订阅，不向其他 Agent 转发账号令牌。": [
    "通過 Cline 原生 OAuth 接入 ChatGPT 訂閱，不向其他 Agent 轉發賬號令牌。",
    "Use Cline's native OAuth for ChatGPT subscriptions. Account tokens are not forwarded to other agents.",
    "Använd Clines OAuth för ChatGPT-abonnemang. Kontotoken vidarebefordras inte till andra agenter.",
    "Cline の OAuth で ChatGPT に接続します。ほかのエージェントへトークンを転送しません。"
  ],
  "Cursor 账号登录": [
    "Cursor 賬號登入",
    "Cursor account sign-in",
    "Logga in med Cursor-konto",
    "Cursor アカウントでログイン"
  ],
  "登录 Cursor CLI 账号；Cursor API Key 是平台认证信息。": [
    "登入 Cursor CLI 賬號；Cursor API Key 是平臺認證資訊。",
    "Sign in to Cursor CLI. Cursor API keys authenticate the platform account.",
    "Logga in på Cursor CLI. Cursor API-nycklar autentiserar plattformskontot.",
    "Cursor CLI にログインします。Cursor API キーはプラットフォームの認証情報です。"
  ],
  "OpenHands 原生模型设置": [
    "OpenHands 原生模型設定",
    "OpenHands model setup",
    "OpenHands modellinställningar",
    "OpenHands のモデル設定"
  ],
  "在 OpenHands 配置向导中设置供应商 API Key、模型和服务地址。": [
    "在 OpenHands 配置嚮導中設定供應商 API Key、模型和服務地址。",
    "Set provider API key, model and URL in the OpenHands wizard.",
    "Ange leverantörsnyckel, modell och adress i OpenHands-guiden.",
    "OpenHands のウィザードで API キー、モデル、URL を設定します。"
  ],
  "OpenHands 原生账号登录": [
    "OpenHands 原生賬號登入",
    "OpenHands account sign-in",
    "Logga in med OpenHands-konto",
    "OpenHands アカウントでログイン"
  ],
  "登录 OpenHands 原厂服务账号。": [
    "登入 OpenHands 原廠服務賬號。",
    "Sign in to the OpenHands service account.",
    "Logga in på OpenHands tjänstekonto.",
    "OpenHands のサービスアカウントにログインします。"
  ],
  "Open Interpreter 原生设置": [
    "Open Interpreter 原生設定",
    "Open Interpreter setup",
    "Open Interpreter-inställningar",
    "Open Interpreter の設定"
  ],
  "使用当前 Open Interpreter CLI 的供应商与账号配置。": [
    "使用當前 Open Interpreter CLI 的供應商與賬號配置。",
    "Use the current Open Interpreter CLI's provider and account configuration.",
    "Använd aktuella Open Interpreter CLIs leverantörs- och kontokonfiguration.",
    "現在の Open Interpreter CLI のプロバイダー・アカウント設定を使用します。"
  ],
  "Augment 账号登录": [
    "Augment 賬號登入",
    "Augment account sign-in",
    "Logga in med Augment-konto",
    "Augment アカウントでログイン"
  ],
  "登录 Augment 账号，再在 Auggie 中选择账号可用的模型。": [
    "登入 Augment 賬號，再在 Auggie 中選擇賬號可用的模型。",
    "Sign in to Augment, then select available models in Auggie.",
    "Logga in på Augment och välj sedan modeller i Auggie.",
    "Augment にログインし、Auggie で利用可能なモデルを選びます。"
  ],
  "Grok 原生模型设置": [
    "Grok 原生模型設定",
    "Grok model setup",
    "Grok modellinställningar",
    "Grok のモデル設定"
  ],
  "在 Grok 原生界面中选择模型；自带 Key 与服务地址使用它的供应商配置。": [
    "在 Grok 原生介面中選擇模型；自帶 Key 與服務地址使用它的供應商配置。",
    "Select models in Grok. Use its provider configuration for your own key and URL.",
    "Välj modeller i Grok. Använd leverantörskonfigurationen för egen nyckel och adress.",
    "Grok の画面でモデルを選びます。独自のキーと URL はプロバイダー設定を使用してください。"
  ],
  "Grok 远程账号登录": [
    "Grok 遠端賬號登入",
    "Grok remote sign-in",
    "Grok fjärrinloggning",
    "Grok のリモートログイン"
  ],
  "使用 Grok 官方设备码登录，可在自己的浏览器中打开终端提供的链接。": [
    "使用 Grok 官方裝置碼登入，可在自己的瀏覽器中開啟終端提供的連結。",
    "Use Grok's official device-code sign-in. Open the terminal's link in your own browser.",
    "Använd Groks enhetskodsinloggning. Öppna terminalens länk i din egen webbläsare.",
    "Grok のデバイスコード認証を使用します。ターミナルのリンクを自分のブラウザーで開けます。"
  ],
  "OMP 模型设置向导": [
    "OMP 模型設定嚮導",
    "OMP model wizard",
    "OMP modellguide",
    "OMP モデル設定ウィザード"
  ],
  "选择默认模型；供应商 API Key 和账号订阅由 OMP 原生配置管理。": [
    "選擇預設模型；供應商 API Key 和賬號訂閱由 OMP 原生配置管理。",
    "Choose a default model. OMP manages provider keys and subscription accounts in its own configuration.",
    "Välj standardmodell. OMP hanterar leverantörsnycklar och abonnemangskonton i egen konfiguration.",
    "既定のモデルを選びます。API キーとサブスクリプションは OMP 自身の設定で管理します。"
  ],
  "可在网页接入支持工具调用的 Chat Completions 模型与编程套餐。": [
    "可在網頁接入支援工具呼叫的 Chat Completions 模型與程式設計套餐。",
    "Connect tool-capable Chat Completions models and Coding Plans from the web.",
    "Anslut Chat Completions-modeller med verktygsstöd och Coding Plans från webben.",
    "ウェブからツール呼び出し対応の Chat Completions モデルや Coding Plan に接続できます。"
  ],
  "语言": [
    "語言",
    "Language",
    "Språk",
    "言語"
  ],
  "界面语言": [
    "介面語言",
    "Interface language",
    "Gränssnittsspråk",
    "表示言語"
  ],
  "当前语言": [
    "當前語言",
    "Selected",
    "Valt",
    "選択中"
  ],
  "选择界面语言，切换立即生效。": [
    "選擇介面語言，切換立即生效。",
    "Choose the interface language. Changes apply immediately.",
    "Välj gränssnittsspråk. Ändringen gäller direkt.",
    "表示言語を選択すると、すぐに切り替わります。"
  ],
  "语言选择保存在此浏览器中。对话内容、代码和文件名保留原文。": [
    "語言選擇儲存在此瀏覽器中。對話內容、程式碼和檔名保留原文。",
    "Your choice is saved in this browser. Conversations, code and filenames keep their original text.",
    "Valet sparas i denna webbläsare. Samtal, kod och filnamn behåller sin ursprungliga text.",
    "言語設定はこのブラウザーに保存されます。会話内容、コード、ファイル名は元のまま表示します。"
  ],
  "字体预览": [
    "字型預覽",
    "Font preview",
    "Typsnittsförhandsvisning",
    "フォントのプレビュー"
  ],
  "让想法成为作品。": [
    "讓想法成為作品。",
    "Bring your ideas to life.",
    "Gör verklighet av dina idéer.",
    "アイデアを作品に。"
  ],
  "清晰的界面，安静地专注于创造。": [
    "清晰的介面，安靜地專注於創造。",
    "A clear interface. Space to focus and create.",
    "Ett tydligt gränssnitt. Ro att fokusera och skapa.",
    "見やすい画面で、静かに創造に集中する。"
  ],
  "看 Agent 做工作。": [
    "看 Agent 做工作。",
    "while Agent does the work.",
    "och låt Agent göra jobbet.",
    "Agent の仕事を見守る。"
  ],
  "火山 Agent Plan": [
    "火山 Agent Plan",
    "Volcengine Agent Plan",
    "Volcengine Agent Plan",
    "Volcengine Agent Plan"
  ],
  "火山 Coding Plan": [
    "火山 Coding Plan",
    "Volcengine Coding Plan",
    "Volcengine Coding Plan",
    "Volcengine Coding Plan"
  ],
  "千问AI平台": [
    "千問AI平臺",
    "Qwen AI Platform",
    "Qwen AI Platform",
    "Qwen AI Platform"
  ],
  "千问AI平台 Coding Plan": [
    "千問AI平臺 Coding Plan",
    "Qwen AI Platform Coding Plan",
    "Qwen AI Platform Coding Plan",
    "Qwen AI Platform Coding Plan"
  ],
  "千问AI平台 Token Plan": [
    "千問AI平臺 Token Plan",
    "Qwen AI Platform Token Plan",
    "Qwen AI Platform Token Plan",
    "Qwen AI Platform Token Plan"
  ],
  "把接口地址中的模板占位符替换为控制台中的实际资源或 Endpoint ID。": [
    "把介面地址中的模板佔位符替換為控制台中的實際資源或 Endpoint ID。",
    "Replace URL placeholders with the actual resource or endpoint ID from your console.",
    "Ersätt adressens platshållare med resursens eller slutpunktens ID från konsolen.",
    "URL のプレースホルダーをコンソール内の実際のリソースまたは Endpoint ID に置き換えてください。"
  ],
  "模型和订阅请通过 Agent 原生设置或账号登录接入，支持的供应商与套餐以官方文档为准。": [
    "模型和訂閱請通過 Agent 原生設定或賬號登入接入，支援的供應商與套餐以官方文件為準。",
    "Configure models and subscriptions using the agent's own settings or sign-in. Check its official docs for supported providers and plans.",
    "Konfigurera modeller och abonnemang via agentens egna inställningar eller inloggning. Se officiell dokumentation för leverantörer och planer.",
    "モデルとサブスクリプションはエージェント自身の設定やログインで接続してください。対応プロバイダーとプランは公式ドキュメントを確認してください。"
  ],
  "请输入当前密码": [
    "請輸入當前密碼",
    "Enter the current password",
    "Ange aktuellt lösenord",
    "現在のパスワードを入力してください"
  ],
  "请求失败，请重试": [
    "請求失敗，請重試",
    "Request failed. Please retry.",
    "Begäran misslyckades. Försök igen.",
    "要求に失敗しました。再試行してください。"
  ],
  "还有 {0} 项待批准": [
    "還有 {0} 項待批准",
    "Additional approvals: {0}",
    "Ytterligare godkännanden: {0}",
    "ほかに {0} 件の承認待ち"
  ],
  "排队 {0} 条": [
    "排隊 {0} 條",
    "Queued: {0}",
    "I kö: {0}",
    "送信待ち：{0} 件"
  ],
  "已启动 {0} 个 Agent": [
    "已啟動 {0} 個 Agent",
    "Agents running: {0}",
    "Aktiva agenter: {0}",
    "起動中のエージェント：{0} 個"
  ],
  "当前已启动 {0} 个 Agent，上限 {1} 个": [
    "當前已啟動 {0} 個 Agent，上限 {1} 個",
    "Running agents: {0} / {1}",
    "Aktiva agenter: {0} / {1}",
    "起動中：{0} 個 / 上限：{1} 個"
  ],
  "找到了 {0} 个 Agent": [
    "找到了 {0} 個 Agent",
    "Agents found: {0}",
    "Hittade agenter: {0}",
    "{0} 個のエージェントが見つかりました"
  ],
  "在 {0} 里启动": [
    "在 {0} 裡啟動",
    "Start in {0}",
    "Starta i {0}",
    "{0} で起動"
  ],
  "正在创建新分支": [
    "正在建立新分支",
    "Creating branch",
    "Skapar gren",
    "新しいブランチを作成中"
  ],
  "已创建并切换到新分支": [
    "已建立並切換到新分支",
    "Created and switched to the new branch",
    "Skapade och växlade till den nya grenen",
    "新しいブランチを作成して切り替えました"
  ],
  "已创建新分支": [
    "已建立新分支",
    "Created new branch",
    "Skapade ny gren",
    "新しいブランチを作成しました"
  ],
  "新建分支失败，请重试": [
    "新建分支失敗，請重試",
    "Could not create branch. Try again.",
    "Kunde inte skapa gren. Försök igen.",
    "ブランチを作成できませんでした。再試行してください。"
  ],
  "新建分支": [
    "新建分支",
    "New branch",
    "Ny gren",
    "新しいブランチ"
  ],
  "正在创建新分支…": [
    "正在建立新分支…",
    "Creating branch…",
    "Skapar gren…",
    "新しいブランチを作成中…"
  ],
  "新建并切换分支，保留当前改动": [
    "新建並切換分支，保留當前改動",
    "Create and switch to a new branch, keeping current changes",
    "Skapa och växla till en ny gren, behåll aktuella ändringar",
    "現在の変更を保持して、新しいブランチを作成・切り替え"
  ],
  "按状态筛选所有工作区的会话": [
    "按狀態篩選所有工作區的會話",
    "Filter sessions in all workspaces by status",
    "Filtrera sessioner i alla arbetsytor efter status",
    "すべてのワークスペースのセッションを状態で絞り込む"
  ],
  "只看{0}的会话，共 {1} 个": [
    "只看{0}的會話，共 {1} 個",
    "Show only {0} sessions ({1})",
    "Visa bara sessioner med status {0} ({1})",
    "{0}のセッションのみ表示（{1} 件）"
  ],
  "分支列表暂时读不到，请重试": [
    "分支列表暫時讀不到，請重試",
    "Couldn't load branches. Please try again.",
    "Det gick inte att läsa in grenar. Försök igen.",
    "ブランチ一覧を読み込めませんでした。もう一度お試しください。"
  ],
  "正在切换分支": [
    "正在切換分支",
    "Switching branch",
    "Byter gren",
    "ブランチを切り替えています"
  ],
  "已切换到 {0}": [
    "已切換到 {0}",
    "Switched to {0}",
    "Bytte till {0}",
    "{0} に切り替えました"
  ],
  "已切换分支": [
    "已切換分支",
    "Branch switched",
    "Grenen har bytts",
    "ブランチを切り替えました"
  ],
  "分支操作失败，请重试": [
    "分支操作失敗，請重試",
    "Branch action failed. Please try again.",
    "Grenåtgärden misslyckades. Försök igen.",
    "ブランチの操作に失敗しました。もう一度お試しください。"
  ],
  "删除本地分支「{0}」？项目文件会保留，未合并的提交会阻止删除。": [
    "刪除本機分支「{0}」？專案檔案會保留，未合併的提交會阻止刪除。",
    "Delete local branch “{0}”? Project files are kept; unmerged commits will block the deletion.",
    "Ta bort den lokala grenen ”{0}”? Projektfilerna behålls; ej sammanfogade commits stoppar borttagningen.",
    "ローカルブランチ「{0}」を削除しますか？プロジェクトのファイルは残ります。未マージのコミットがある場合は削除できません。"
  ],
  "正在删除分支": [
    "正在刪除分支",
    "Deleting branch",
    "Tar bort gren",
    "ブランチを削除しています"
  ],
  "分支已删除": [
    "分支已刪除",
    "Branch deleted",
    "Grenen har tagits bort",
    "ブランチを削除しました"
  ],
  "删除分支失败，请重试": [
    "刪除分支失敗，請重試",
    "Couldn't delete the branch. Please try again.",
    "Det gick inte att ta bort grenen. Försök igen.",
    "ブランチを削除できませんでした。もう一度お試しください。"
  ],
  "切换或新建分支": [
    "切換或新建分支",
    "Switch or create a branch",
    "Byt eller skapa gren",
    "ブランチを切り替えまたは作成"
  ],
  "切换或新建分支（当前：{0}）": [
    "切換或新建分支（目前：{0}）",
    "Switch or create a branch (current: {0})",
    "Byt eller skapa gren (nuvarande: {0})",
    "ブランチを切り替えまたは作成（現在：{0}）"
  ],
  "切换分支": [
    "切換分支",
    "Switch branch",
    "Byt gren",
    "ブランチを切り替え"
  ],
  "重新加载": [
    "重新載入",
    "Reload",
    "Läs in igen",
    "再読み込み"
  ],
  "当前": [
    "目前",
    "Current",
    "Nuvarande",
    "現在"
  ],
  "删除分支 {0}": [
    "刪除分支 {0}",
    "Delete branch {0}",
    "Ta bort gren {0}",
    "ブランチ {0} を削除"
  ],
  "Git 操作失败，当前文件已保留。请检查 Git 状态后重试。": [
    "Git 操作失敗，目前檔案已保留。請檢查 Git 狀態後重試。",
    "Git operation failed; your files are unchanged. Check the Git status and try again.",
    "Git-åtgärden misslyckades; dina filer är oförändrade. Kontrollera Git-status och försök igen.",
    "Git の操作に失敗しました。ファイルはそのままです。Git の状態を確認してもう一度お試しください。"
  ],
  "Git 正在处理其他操作，请稍后重试": [
    "Git 正在處理其他操作，請稍後重試",
    "Git is busy with another operation. Please try again shortly.",
    "Git är upptaget med en annan åtgärd. Försök igen om en stund.",
    "Git が別の操作を処理中です。しばらくしてからお試しください。"
  ],
  "不支持这个分支操作": [
    "不支援這個分支操作",
    "This branch action isn't supported",
    "Den här grenåtgärden stöds inte",
    "このブランチ操作はサポートされていません"
  ],
  "不能删除当前分支，请先切换到其他分支。": [
    "不能刪除目前分支，請先切換到其他分支。",
    "You can't delete the current branch. Switch to another branch first.",
    "Du kan inte ta bort den aktuella grenen. Byt till en annan gren först.",
    "現在のブランチは削除できません。先に別のブランチに切り替えてください。"
  ],
  "分支名称无效": [
    "分支名稱無效",
    "Invalid branch name",
    "Ogiltigt grennamn",
    "ブランチ名が無効です"
  ],
  "切换会覆盖当前改动，已取消。请先提交改动再切换。": [
    "切換會覆蓋目前改動，已取消。請先提交改動再切換。",
    "Switching would overwrite your current changes, so it was cancelled. Commit your changes first.",
    "Bytet skulle skriva över dina ändringar och avbröts. Gör en commit först.",
    "切り替えると現在の変更が上書きされるため、キャンセルしました。先に変更をコミットしてください。"
  ],
  "切换分支请求格式不正确": [
    "切換分支請求格式不正確",
    "The switch-branch request is malformed",
    "Begäran om grenbyte har fel format",
    "ブランチ切り替えのリクエスト形式が正しくありません"
  ],
  "删除分支请求格式不正确": [
    "刪除分支請求格式不正確",
    "The delete-branch request is malformed",
    "Begäran om att ta bort gren har fel format",
    "ブランチ削除のリクエスト形式が正しくありません"
  ],
  "工作区不存在，请重新选择": [
    "工作區不存在，請重新選擇",
    "This workspace no longer exists. Please choose again.",
    "Arbetsytan finns inte längre. Välj igen.",
    "ワークスペースが存在しません。選び直してください。"
  ],
  "新建分支请求格式不正确": [
    "新建分支請求格式不正確",
    "The new-branch request is malformed",
    "Begäran om ny gren har fel format",
    "ブランチ作成のリクエスト形式が正しくありません"
  ],
  "新建分支请求格式不正确，请刷新后重试": [
    "新建分支請求格式不正確，請重新整理後重試",
    "The new-branch request is malformed. Refresh and try again.",
    "Begäran om ny gren har fel format. Uppdatera och försök igen.",
    "ブランチ作成のリクエスト形式が正しくありません。再読み込みしてからお試しください。"
  ],
  "请选择要切换的分支": [
    "請選擇要切換的分支",
    "Choose a branch to switch to",
    "Välj en gren att byta till",
    "切り替えるブランチを選んでください"
  ],
  "请选择要删除的分支": [
    "請選擇要刪除的分支",
    "Choose a branch to delete",
    "Välj en gren att ta bort",
    "削除するブランチを選んでください"
  ],
  "这个分支正在另一个工作区使用，请先在那里处理。": [
    "這個分支正在另一個工作區使用，請先在那裡處理。",
    "This branch is in use in another workspace. Handle it there first.",
    "Grenen används i en annan arbetsyta. Hantera den där först.",
    "このブランチは別のワークスペースで使用中です。先にそちらで対応してください。"
  ],
  "这个分支还有未合并的提交，已保留。请先合并后再删除。": [
    "這個分支還有未合併的提交，已保留。請先合併後再刪除。",
    "This branch has unmerged commits, so it was kept. Merge it before deleting.",
    "Grenen har commits som inte sammanfogats och behölls. Sammanfoga den innan du tar bort den.",
    "このブランチには未マージのコミットがあるため残しました。マージしてから削除してください。"
  ],
  "这个本地分支不存在，请刷新分支列表": [
    "這個本機分支不存在，請重新整理分支列表",
    "This local branch doesn't exist. Refresh the branch list.",
    "Den lokala grenen finns inte. Uppdatera grenlistan.",
    "このローカルブランチは存在しません。ブランチ一覧を更新してください。"
  ],
  "这个项目还未启用 Git，无法管理分支": [
    "這個專案還未啟用 Git，無法管理分支",
    "This project doesn't use Git yet, so branches can't be managed",
    "Projektet använder inte Git än, så grenar kan inte hanteras",
    "このプロジェクトはまだ Git を使っていないため、ブランチを管理できません"
  ],
  "项目还没有第一次 Git 提交，请先提交当前代码再新建分支": [
    "專案還沒有第一次 Git 提交，請先提交目前程式碼再新建分支",
    "The project has no Git commits yet. Commit your code before creating a branch.",
    "Projektet har inga Git-commits än. Gör en commit innan du skapar en gren.",
    "プロジェクトにまだ Git のコミットがありません。先にコードをコミットしてからブランチを作成してください。"
  ],
  "只属于你自己电脑上的多 Agent 工作台": [
    "只屬於你自己電腦上的多 Agent 工作台",
    "A multi-agent workbench on your own computer, just for you",
    "En arbetsbänk för flera agenter på din egen dator, bara för dig",
    "あなたのコンピューターで動く、あなただけのマルチ Agent ワークベンチ"
  ],
  "这个设置链接不对，或者已经用过了。请到运行 Fika Desk 的电脑上，在后台日志里找最新的链接。": [
    "這個設定連結不對，或者已經用過了。請到執行 Fika Desk 的電腦上，在背景日誌裡找最新的連結。",
    "This setup link is wrong or has already been used. On the computer running Fika Desk, find the latest link in the backend log.",
    "Den här installationslänken är fel eller har redan använts. Hitta den senaste länken i bakgrundsloggen på datorn som kör Fika Desk.",
    "この設定リンクは正しくないか、すでに使用済みです。Fika Desk を実行しているコンピューターのバックエンドログで最新のリンクを探してください。"
  ],
  "连不上 Fika Desk，稍后再试。": [
    "連不上 Fika Desk，稍後再試。",
    "Can't reach Fika Desk. Please try again later.",
    "Kan inte nå Fika Desk. Försök igen senare.",
    "Fika Desk に接続できません。しばらくしてからお試しください。"
  ],
  "第一次使用要先设置密码。为了安全，设置页只能用运行 Fika Desk 的电脑上打印出来的链接打开。": [
    "第一次使用要先設定密碼。為了安全，設定頁只能用執行 Fika Desk 的電腦上印出來的連結開啟。",
    "Set a password before first use. For security, the setup page only opens from the link printed on the computer running Fika Desk.",
    "Ange ett lösenord innan första användningen. Av säkerhetsskäl öppnas inställningssidan bara via länken som skrivs ut på datorn som kör Fika Desk.",
    "初めて使う前にパスワードを設定してください。安全のため、設定ページは Fika Desk を実行しているコンピューターに表示されたリンクからしか開けません。"
  ],
  "在那台电脑的后台日志（数据目录下的 runtime/runner.log）里找“首次使用”那一段，打开里面的链接。": [
    "在那台電腦的背景日誌（資料目錄下的 runtime/runner.log）裡找「首次使用」那一段，開啟裡面的連結。",
    "In that computer's backend log (runtime/runner.log in the data directory), find the “first use” section and open the link in it.",
    "I den datorns bakgrundslogg (runtime/runner.log i datakatalogen), leta upp avsnittet ”första användning” och öppna länken där.",
    "そのコンピューターのバックエンドログ（データディレクトリの runtime/runner.log）で「初回利用」の部分を探し、そのリンクを開いてください。"
  ],
  "第一次使用。这是 Fika Desk 唯一的账户，只有你能用。": [
    "第一次使用。這是 Fika Desk 唯一的帳戶，只有你能用。",
    "First use. This is the only Fika Desk account, and only you can use it.",
    "Första användningen. Det här är det enda Fika Desk-kontot, och bara du kan använda det.",
    "初めての利用です。これは Fika Desk の唯一のアカウントで、使えるのはあなただけです。"
  ],
  "欢迎回来。这个工作台只有你能登录。": [
    "歡迎回來。這個工作台只有你能登入。",
    "Welcome back. Only you can sign in to this workbench.",
    "Välkommen tillbaka. Bara du kan logga in på den här arbetsbänken.",
    "おかえりなさい。このワークベンチにログインできるのはあなただけです。"
  ],
  "在运行 Fika Desk 的电脑上，进入 Fika Desk 的目录运行": [
    "在執行 Fika Desk 的電腦上，進入 Fika Desk 的目錄執行",
    "On the computer running Fika Desk, go to the Fika Desk folder and run",
    "På datorn som kör Fika Desk, gå till Fika Desk-mappen och kör",
    "Fika Desk を実行しているコンピューターで、Fika Desk のフォルダーに移動して次を実行："
  ],
  "，再用后台日志里的新链接重新设置密码。": [
    "，再用背景日誌裡的新連結重新設定密碼。",
    ", then set a new password with the new link in the backend log.",
    ", och ange sedan ett nytt lösenord via den nya länken i bakgrundsloggen.",
    "。その後、バックエンドログの新しいリンクからパスワードを設定し直してください。"
  ],
  "在这个浏览器上保持登录 30 天": [
    "在這個瀏覽器上保持登入 30 天",
    "Stay signed in on this browser for 30 days",
    "Förbli inloggad i den här webbläsaren i 30 dagar",
    "このブラウザーで 30 日間ログインしたままにする"
  ],
  "忘记密码时，在运行 Fika Desk 的电脑上运行": [
    "忘記密碼時，在執行 Fika Desk 的電腦上執行",
    "If you forget the password, run this on the computer running Fika Desk:",
    "Om du glömmer lösenordet, kör detta på datorn som kör Fika Desk:",
    "パスワードを忘れたときは、Fika Desk を実行しているコンピューターで次を実行："
  ],
  "你的多 Agent 工作台": [
    "你的多 Agent 工作台",
    "Your multi-agent workbench",
    "Din arbetsbänk för flera agenter",
    "あなたのマルチ Agent ワークベンチ"
  ],
  "还有 {0} 个会话：": [
    "還有 {0} 個會話：",
    "{0} more sessions:",
    "{0} sessioner till:",
    "ほかに {0} 件のセッション："
  ],
  "还有 {0} 个会话，滚到下一组": [
    "還有 {0} 個會話，捲到下一組",
    "{0} more sessions, scroll to the next group",
    "{0} sessioner till, rulla till nästa grupp",
    "ほかに {0} 件のセッション、次のグループへスクロール"
  ],
  "前面还有 {0} 个会话：": [
    "前面還有 {0} 個會話：",
    "{0} earlier sessions:",
    "{0} tidigare sessioner:",
    "前にさらに {0} 件のセッション："
  ],
  "前面还有 {0} 个会话，滚回上一组": [
    "前面還有 {0} 個會話，捲回上一組",
    "{0} earlier sessions, scroll back to the previous group",
    "{0} tidigare sessioner, rulla tillbaka till föregående grupp",
    "前にさらに {0} 件のセッション、前のグループへ戻る"
  ],
  "这个网页能让 Agent 在运行 Fika Desk 的电脑上执行命令，登录信息请只留在自己的设备上。": [
    "這個網頁能讓 Agent 在執行 Fika Desk 的電腦上執行命令，登入資訊請只留在自己的裝置上。",
    "This web page lets Agents run commands on the computer running Fika Desk. Keep your sign-in only on your own devices.",
    "Den här webbsidan låter agenter köra kommandon på datorn som kör Fika Desk. Behåll inloggningen bara på dina egna enheter.",
    "この Web ページでは、Fika Desk を実行しているコンピューター上で Agent がコマンドを実行できます。ログイン情報は自分のデバイスにだけ残してください。"
  ],
  "管理运行 Fika Desk 的电脑上的项目文件夹，以及网页可添加项目的目录范围。": [
    "管理執行 Fika Desk 的電腦上的專案資料夾，以及網頁可新增專案的目錄範圍。",
    "Manage project folders on the computer running Fika Desk, and the directories the web page may add projects from.",
    "Hantera projektmappar på datorn som kör Fika Desk och vilka kataloger webbsidan får lägga till projekt från.",
    "Fika Desk を実行しているコンピューター上のプロジェクトフォルダーと、Web ページから追加できるディレクトリの範囲を管理します。"
  ],
  "默认": [
    "預設",
    "Default",
    "Standard",
    "既定"
  ]
};
